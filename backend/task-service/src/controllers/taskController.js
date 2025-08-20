const axios = require("axios");
const { Op } = require("sequelize");
const Task = require("../models/Task");
const { validateUser } = require("../services/userService");
const { getUserByEmail } = require("../services/userService");
const { getMahasiswaInClass } = require("../services/classService");
const { publishMessage } = require("../utils/rabbitmqPublisher");
const { publishToProgress } = require("../utils/progressPublisher");
const { getDeadlineStatus } = require("../utils/deadlineHelper");

const createTask = async (req, res) => {
  const {
    judul,
    description,
    deadline,
    email,
    mataKuliah: mataKuliahInput, // optional: mahasiswa spesifik
  } = req.body;

  const classId = req.params.classId || req.body.classId; // Ambil classId dari URL atau body
  const { id: dosenId, role, name: dosenName } = req.user;
  const token = req.headers.authorization?.split(" ")[1];

  let mataKuliah = null;
  try {
    if (role !== "Dosen") {
      return res
        .status(403)
        .json({ error: "Hanya dosen yang diperbolehkan membuat tugas" });
    }

    if (!judul || !description || !deadline || (!email && !classId)) {
      return res.status(400).json({
        error:
          "Field wajib: judul, description, deadline, dan email atau classId",
      });
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
      return res
        .status(400)
        .json({ error: "Deadline tidak valid atau sudah lewat" });
    }

    let mahasiswaList = [];

    // === Jika target adalah kelas ===
    if (classId) {
      // Ambil data kelas dari class-service
      const classResponse = await axios.get(
        `http://class-service:4006/class/${classId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!classResponse.data || !classResponse.data.class) {
        return res
          .status(404)
          .json({ error: "Kelas tidak ditemukan di class-service" });
      }

      const classData = classResponse.data.class || classResponse.data;

      if (!classData || !classData.mataKuliah) {
        return res
          .status(400)
          .json({ error: "Mata kuliah tidak ditemukan dalam data kelas" });
      }

      console.log("classResponse.data:", classData);

      mataKuliah = classData.mataKuliah;

      const classMahasiswa = await getMahasiswaInClass(classId, token);
      if (!Array.isArray(classMahasiswa) || classMahasiswa.length === 0) {
        return res.status(404).json({
          error: "Tidak ada mahasiswa ditemukan dalam kelas tersebut",
        });
      }
      mahasiswaList = classMahasiswa;
    }

    // === Jika target adalah satu mahasiswa ===
    if (email) {
      const mahasiswa = await getUserByEmail(email, "Mahasiswa", token);

      if (!mahasiswa || mahasiswa.role !== "Mahasiswa") {
        return res
          .status(403)
          .json({ error: "Email tidak ditemukan atau bukan Mahasiswa" });
      }

      if (mahasiswa.id === dosenId) {
        return res.status(403).json({
          error: "Dosen tidak boleh membuat tugas untuk dirinya sendiri",
        });
      }

      // Mata kuliah wajib kalau target mahasiswa langsung
      if (!mataKuliahInput) {
        return res.status(400).json({
          error: "Mata kuliah wajib diisi untuk tugas mahasiswa tertentu",
        });
      }

      mataKuliah = mataKuliahInput;
      mahasiswaList.push(mahasiswa);
    }

    // Buat masterTask jika untuk kelas
    let masterTask = null;
    if (classId) {
      masterTask = await Task.create({
        dosenName,
        mataKuliah,
        judul,
        description,
        deadline,
        classId,
        createdBy: dosenId,
        assignedTo: null,
      });
    }

    // Buat tugas untuk tiap mahasiswa
    const createdTasks = [];

    for (const mhs of mahasiswaList) {
      const task = await Task.create({
        dosenName,
        mahasiswaName: mhs.name,
        mataKuliah,
        judul,
        description,
        deadline,
        classId: classId || null,
        createdBy: dosenId,
        assignedTo: mhs.id,
        masterTaskId: masterTask?.id || null,
      });

      await publishToProgress(task.id, mhs.id, "Individual", dosenId, mhs.id);
      
      await publishMessage("task.created", {
        service: "task-service",
        type: "task.created",
        message: `Tugas: ${judul} dari Dosen: ${dosenName} telah berhasil dibuat untuk Anda.`,
        userId: mhs.id,
      });

      createdTasks.push(task);
    }

    // 🔔 Kirim notifikasi ke dosen sebagai konfirmasi
    await publishMessage("task.created", {
      service: "task-service",
      type: "task.created",
      message: `${createdTasks.length} tugas berhasil dibuat untuk mahasiswa.`,
      userId: dosenId,
    });

    res.status(201).json({
      success: true,
      message: `${createdTasks.length} tugas berhasil dibuat`,
      masterTask,
      tasks: createdTasks,
    });
  } catch (err) {
    console.error("createTask:", err.message);
    res.status(500).json({ error: err.message });
  }
};

const getTasksByClassId = async (req, res) => {
  const { classId } = req.params;
  const { id: userId, role } = req.user;

  try {
    // Validasi hanya Dosen atau Mahasiswa yang bisa akses kelas ini (optional)
    if (role !== "Dosen" && role !== "Mahasiswa") {
      return res.status(403).json({ error: "Anda tidak memiliki akses" });
    }

    let tasks;

    if (role === "Dosen") {
      // DOSEN: Tugas utama (belum ditugaskan ke mahasiswa)
      tasks = await Task.findAll({
        where: {
          classId,
          assignedTo: null,
        },
        order: [["createdAt", "DESC"]],
      });
    } else if (role === "Mahasiswa") {
      // MAHASISWA: Tugas untuk dirinya sendiri
      tasks = await Task.findAll({
        where: {
          classId,
          assignedTo: userId,
        },
        order: [["createdAt", "DESC"]],
      });
    }

    const tasksWithStatus = await Promise.all(
      tasks.map(async (task) => {
        const taskJSON = task.toJSON();
        const deadlineStatus = getDeadlineStatus(
          taskJSON.deadline,
          taskJSON.status
        );

        // Simpan ke DB jika status berubah
        if (taskJSON.deadlineStatus !== deadlineStatus) {
          await task.update({ deadlineStatus });
        }

        taskJSON.deadlineStatus = deadlineStatus;
        return taskJSON;
      })
    );

    res.json({ success: true, tasksWithStatus });
  } catch (error) {
    console.error("Error getTasksByClass:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const getAssignedTasksByMasterTaskId = async (req, res) => {
  const { id: userId, role } = req.user;
  const { masterTaskId } = req.params;

  try {
    // Validasi hanya Dosen atau Mahasiswa yang bisa akses
    if (role !== "Dosen" && role !== "Mahasiswa") {
      return res.status(403).json({ error: "Anda tidak memiliki akses" });
    }

    // Ambil semua tugas yang memiliki masterTaskId sama (dan sudah diassign ke mahasiswa)
    const tasks = await Task.findAll({
      where: {
        masterTaskId: masterTaskId,
        assignedTo: {
          [Op.ne]: null,
        },
      },
      order: [["createdAt", "DESC"]],
    });

    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Belum ada tugas yang ditugaskan berdasarkan masterTaskId ini",
      });
    }

    const tasksWithStatus = await Promise.all(
      tasks.map(async (task) => {
        const taskJSON = task.toJSON();
        const deadlineStatus = getDeadlineStatus(
          taskJSON.deadline,
          taskJSON.status
        );

        // Simpan ke DB jika status berubah
        if (taskJSON.deadlineStatus !== deadlineStatus) {
          await task.update({ deadlineStatus });
        }

        taskJSON.deadlineStatus = deadlineStatus;
        return taskJSON;
      })
    );

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasksWithStatus,
    });
  } catch (err) {
    console.error("getAssignedTasksByMasterTaskId error:", err.message);
    res.status(500).json({ error: "Terjadi kesalahan saat mengambil tugas" });
  }
};

const getTasks = async (req, res) => {
  const { id: userId, role } = req.user;
  let where = {};

  try {
    if (role === "Mahasiswa") {
      // Tugas yang ditugaskan ke mahasiswa
      where = {
        [Op.or]: [{ createdBy: userId }, { assignedTo: userId }],
      };
    } else if (role === "Dosen") {
      // Tugas yang dibuat oleh dosen
      where = {
        createdBy: userId,
      };
    } else {
      // Role lain tidak diizinkan melihat tugas
      return res.status(403).json({ error: "Anda tidak memiliki akses" });
    }

    const tasks = await Task.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });
    // res.json({ success: true, tasks });

    const tasksWithStatus = await Promise.all(
      tasks.map(async (task) => {
        const taskJSON = task.toJSON();
        const deadlineStatus = getDeadlineStatus(
          taskJSON.deadline,
          taskJSON.status
        );

        // Simpan ke DB jika status berubah
        if (taskJSON.deadlineStatus !== deadlineStatus) {
          await task.update({ deadlineStatus });
        }

        taskJSON.deadlineStatus = deadlineStatus;
        return taskJSON;
      })
    );

    res.status(200).json(tasksWithStatus);
  } catch (error) {
    console.error("Error getTasks:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const getAllTasksConnectedToClass = async (req, res) => {
  const { id: userId, role } = req.user;

  try {
    if (role === "Dosen") {
      // Ambil semua tugas yang dibuat oleh dosen dan punya classId
      const tasks = await Task.findAll({
        where: {
          createdBy: userId,
          classId: {
            [Op.ne]: null,
          },
          assignedTo: {
            [Op.ne]: null, // hanya tugas yang diberikan ke mahasiswa (bukan masterTask)
          },
        },
        order: [["createdAt", "DESC"]],
      });

      const tasksWithStatus = await Promise.all(
        tasks.map(async (task) => {
          const taskJSON = task.toJSON();
          const deadlineStatus = getDeadlineStatus(
            taskJSON.deadline,
            taskJSON.status
          );
          if (taskJSON.deadlineStatus !== deadlineStatus) {
            await task.update({ deadlineStatus });
          }
          taskJSON.deadlineStatus = deadlineStatus;
          return taskJSON;
        })
      );

      return res.status(200).json({
        success: true,
        count: tasksWithStatus.length,
        tasks: tasksWithStatus,
      });
    }

    if (role === "Mahasiswa") {
      // Tugas yang ditugaskan ke mahasiswa dan terhubung ke kelas
      const tasks = await Task.findAll({
        where: {
          assignedTo: userId,
          classId: {
            [Op.ne]: null,
          },
        },
        order: [["createdAt", "DESC"]],
      });

      const tasksWithStatus = await Promise.all(
        tasks.map(async (task) => {
          const taskJSON = task.toJSON();
          const deadlineStatus = getDeadlineStatus(
            taskJSON.deadline,
            taskJSON.status
          );
          if (taskJSON.deadlineStatus !== deadlineStatus) {
            await task.update({ deadlineStatus });
          }
          taskJSON.deadlineStatus = deadlineStatus;
          return taskJSON;
        })
      );

      return res.status(200).json({
        success: true,
        count: tasksWithStatus.length,
        tasks: tasksWithStatus,
      });
    }

    return res.status(403).json({ error: "Role tidak memiliki akses" });
  } catch (error) {
    console.error("Error in getAllTasksConnectedToClass:", error.message);
    return res
      .status(500)
      .json({ error: "Terjadi kesalahan saat mengambil tugas" });
  }
};

const getAllTasksWithoutClass = async (req, res) => {
  const { id: userId, role } = req.user;
  let where = {};

  try {
    if (role === "Dosen") {
      // Ambil semua tugas yang dibuat oleh dosen yang tidak terhubung ke classId
      where = {
        createdBy: userId,
        classId: null,
      };
    } else if (role === "Mahasiswa") {
      // Ambil semua tugas yang assigned ke mahasiswa dan tidak terhubung ke classId
      where = {
        assignedTo: userId,
        classId: null,
      };
    } else {
      return res.status(403).json({ error: "Role tidak memiliki akses" });
    }

    const tasks = await Task.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    // Tambahkan status deadline
    const tasksWithStatus = await Promise.all(
      tasks.map(async (task) => {
        const taskJSON = task.toJSON();
        const deadlineStatus = getDeadlineStatus(
          taskJSON.deadline,
          taskJSON.status
        );
        if (taskJSON.deadlineStatus !== deadlineStatus) {
          await task.update({ deadlineStatus });
        }
        taskJSON.deadlineStatus = deadlineStatus;
        return taskJSON;
      })
    );

    return res.status(200).json(tasksWithStatus);
  } catch (error) {
    console.error("Error in getAllTasksWithoutClass:", error.message);
    return res
      .status(500)
      .json({ error: "Terjadi kesalahan saat mengambil tugas" });
  }
};

const getTaskById = async (req, res) => {
  const taskId = req.params.id;
  const { id: userId, role } = req.user;

  try {
    // Cari task berdasarkan id
    const task = await Task.findByPk(taskId);

    if (!task) {
      return res.status(404).json({ message: "Tugas tidak ditemukan" });
    }

    // Role Admin tidak diizinkan
    if (role === "Admin") {
      return res
        .status(403)
        .json({ message: "Admin tidak diizinkan mengakses tugas" });
    }

    // Mahasiswa hanya boleh lihat tugas yang ditugaskan ke dirinya
    if (role === "Mahasiswa" && task.assignedTo !== userId) {
      return res
        .status(403)
        .json({ error: "Anda tidak memiliki akses ke tugas ini" });
    }

    // Dosen hanya boleh lihat tugas yang dia buat
    if (role === "Dosen" && task.createdBy !== userId) {
      return res
        .status(403)
        .json({ error: "Anda tidak memiliki akses ke tugas ini" });
    }

    // Jika valid, kirim data tugas
    // res.json({ success: true, task });

    const taskJSON = task.toJSON();
    const deadlineStatus = getDeadlineStatus(
      taskJSON.deadline,
      taskJSON.status
    );

    // Simpan ke DB jika berubah
    if (taskJSON.deadlineStatus !== deadlineStatus) {
      await task.update({ deadlineStatus });
    }

    taskJSON.deadlineStatus = deadlineStatus;

    res.status(200).json(taskJSON);
  } catch (error) {
    console.error("Error getTasksBy:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const getTaskCountConnectedToClass = async (req, res) => {
  const { id: userId, role } = req.user;

  try {
    let where = {};

    if (role === "Dosen") {
      where = {
        createdBy: userId,
        classId: { [Op.ne]: null },
      };
    } else if (role === "Mahasiswa") {
      where = {
        assignedTo: userId,
        classId: { [Op.ne]: null },
      };
    } else {
      return res.status(403).json({ error: "Role tidak memiliki akses" });
    }

    const count = await Task.count({ where });

    return res.status(200).json({
      success: true,
      role,
      connectedToClass: true,
      count,
    });
  } catch (error) {
    console.error("Error in getTaskCountConnectedToClass:", error.message);
    return res
      .status(500)
      .json({ error: "Terjadi kesalahan saat menghitung tugas" });
  }
};

const getTaskCountWithoutClass = async (req, res) => {
  const { id: userId, role } = req.user;

  try {
    let where = {};

    if (role === "Dosen") {
      where = {
        createdBy: userId,
        classId: null,
      };
    } else if (role === "Mahasiswa") {
      where = {
        assignedTo: userId,
        classId: null,
      };
    } else {
      return res.status(403).json({ error: "Role tidak memiliki akses" });
    }

    const count = await Task.count({ where });

    return res.status(200).json({
      success: true,
      role,
      connectedToClass: false,
      count,
    });
  } catch (error) {
    console.error("Error in getTaskCountWithoutClass:", error.message);
    return res
      .status(500)
      .json({ error: "Terjadi kesalahan saat menghitung tugas" });
  }
};

const updateTasksByMasterTaskId = async (req, res) => {
  const { masterTaskId } = req.params;
  const { id: userId, role, name } = req.user;
  const { judul, description, deadline } = req.body;

  try {
    // Hanya dosen pembuat tugas yang boleh edit
    if (role !== "Dosen") {
      return res.status(403).json({
        error: "Anda tidak memiliki izin untuk mengedit tugas ini",
      });
    }

    // Ambil master task
    const masterTask = await Task.findByPk(masterTaskId);
    if (!masterTask) {
      return res.status(404).json({ error: "Master task tidak ditemukan" });
    }

    // Pastikan user adalah pembuat master task
    if (masterTask.createdBy !== userId) {
      return res.status(403).json({
        error: "Anda bukan pembuat tugas ini, tidak bisa mengedit",
      });
    }

    // Ambil semua sub-tugas (yang memiliki masterTaskId sama)
    const subTasks = await Task.findAll({
      where: { masterTaskId },
    });

    // Simpan judul lama master task (untuk notifikasi)
    const oldTitle = masterTask.judul;

    // Gabungkan master task + sub tasks jadi satu array untuk diupdate
    const allTasks = [masterTask, ...subTasks];

    // Update semua task sesuai field yang dikirim
    for (const task of allTasks) {
      if (judul !== undefined) task.judul = judul;
      if (description !== undefined) task.description = description;
      if (deadline !== undefined) task.deadline = deadline;
      await task.save();

      // Kirim notifikasi ke mahasiswa penerima (jika ada)
      if (task.assignedTo) {
        await publishMessage("task.updated", {
          service: "task-service",
          type: "task.updated",
          message: `Tugas "${oldTitle}" telah diperbarui. Silakan cek detail terbaru.`,
          userId: task.assignedTo,
        });
      }
    }

    // Notifikasi ke dosen pembuat
    await publishMessage("task.updated", {
      service: "task-service",
      type: "task.updated",
      message: `Anda berhasil memperbarui tugas "${oldTitle}" (beserta semua sub-tugasnya).`,
      userId,
    });

    res.json({
      success: true,
      message: `Berhasil memperbarui master task & semua sub-tugas dengan masterTaskId ${masterTaskId}`,
      updatedCount: allTasks.length,
    });
  } catch (error) {
    console.error("Error updateTasksByMasterTaskId:", error.message);
    res.status(500).json({ error: "Terjadi kesalahan saat memperbarui tugas" });
  }
};

const updateTask = async (req, res) => {
  const taskId = req.params.id;
  const { id: userId, role } = req.user;
  const { judul, description, deadline } = req.body;

  try {
    // Cari task berdasarkan ID
    const task = await Task.findByPk(taskId);

    if (!task) {
      return res.status(404).json({ error: "Tugas tidak ditemukan" });
    }

    // Validasi hanya Dosen pembuat tugas yang bisa edit
    if (role !== "Dosen" || task.createdBy !== userId) {
      return res.status(403).json({
        error: "Anda tidak memiliki izin untuk mengedit tugas ini",
      });
    }

    const oldTitle = task.judul;
    const assignedUserId = task.assignedTo;

    // Update hanya field yang dikirim
    if (judul !== undefined) task.judul = judul;
    if (description !== undefined) task.description = description;
    if (deadline !== undefined) task.deadline = deadline;

    await task.save();

    // 🔔 Kirim notifikasi ke mahasiswa penerima (jika ada)
    if (assignedUserId) {
      await publishMessage("task.updated", {
        service: "task-service",
        type: "task.updated",
        message: `Tugas "${oldTitle}" telah diperbarui. Silakan cek detail terbaru.`,
        userId: assignedUserId,
      });
    }

    // 🔔 Kirim notifikasi ke pembuat (dosen)
    await publishMessage("task.updated", {
      service: "task-service",
      type: "task.updated",
      message: `Anda berhasil memperbarui tugas "${oldTitle}".`,
      userId: task.createdBy,
    });

    res.json({
      success: true,
      message: "Tugas berhasil diperbarui",
      task,
    });
  } catch (error) {
    console.error("Error updateTask:", error.message);
    res.status(500).json({ error: "Terjadi kesalahan saat memperbarui tugas" });
  }
};

const getTasksByStatus = async (req, res) => {
  const { id: userId, role } = req.user;
  const { status } = req.query; // ambil status dari query param

  const allowedStatuses = ["Pending", "In-Progress", "Done", "Revisi", "Terlambat"];

  try {
    if (!status) {
      return res.status(400).json({ error: "Query parameter 'status' wajib diisi." });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Status tidak valid. Pilihan: ${allowedStatuses.join(", ")}` });
    }

    let where = { status };

    if (role === "Mahasiswa") {
      // Tugas yang assigned ke mahasiswa dengan status tertentu
      where.assignedTo = userId;
    } else if (role === "Dosen") {
      // Tugas yang dibuat dosen dengan status tertentu
      where.createdBy = userId;
    } else {
      return res.status(403).json({ error: "Anda tidak memiliki akses." });
    }

    const tasks = await Task.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    // Tambahkan update deadlineStatus (opsional)
    const tasksWithStatus = await Promise.all(
      tasks.map(async (task) => {
        const taskJSON = task.toJSON();
        const deadlineStatus = getDeadlineStatus(taskJSON.deadline, taskJSON.status);
        if (taskJSON.deadlineStatus !== deadlineStatus) {
          await task.update({ deadlineStatus });
        }
        taskJSON.deadlineStatus = deadlineStatus;
        return taskJSON;
      })
    );

    res.status(200).json({
      success: true,
      count: tasksWithStatus.length,
      tasks: tasksWithStatus,
    });
  } catch (error) {
    console.error("getTasksByStatus error:", error.message);
    res.status(500).json({ error: "Terjadi kesalahan saat mengambil tugas berdasarkan status." });
  }
};

const deleteTaskByMasterTaskId = async (req, res) => {
  const { masterTaskId } = req.params;
  const { id: userId, role, name } = req.user;

  try {
    // Hanya dosen yang boleh menghapus tugas
    if (role !== "Dosen") {
      return res
        .status(403)
        .json({ error: "Anda tidak memiliki izin menghapus tugas" });
    }

    // Cari master task (tugas utama)
    const masterTask = await Task.findOne({
      where: {
        id: masterTaskId,
        assignedTo: null, // masterTask tidak punya assignedTo
      },
    });

    if (!masterTask) {
      return res.status(404).json({ error: "Master task tidak ditemukan" });
    }

    // Pastikan master task dimiliki oleh dosen yang sedang login
    if (masterTask.createdBy !== userId) {
      return res
        .status(403)
        .json({ error: "Anda tidak berhak menghapus tugas ini" });
    }

    // Ambil semua subtask penerima
    const subTasks = await Task.findAll({
      where: {
        masterTaskId,
        assignedTo: { [Op.ne]: null },
      },
    });

    // Hapus semua subtask yang punya masterTaskId ini
    const deletedSubTasksCount = await Task.destroy({
      where: {
        masterTaskId: masterTaskId,
        assignedTo: { [Op.ne]: null },
      },
    });

    // Hapus master task
    await masterTask.destroy();

    // --- 🔹 Hapus progress untuk master task ---
    try {
      await axios.delete(
        `http://progress-service:4003/progress/task/individual/${masterTaskId}`,
        {
          headers: {
            Authorization: req.headers.authorization,
          },
        }
      );
    } catch (err) {
      console.error(
        `Gagal menghapus progress master task (${masterTaskId}):`,
        err.response?.data || err.message
      );
    }

    // --- 🔹 Hapus progress untuk semua subtask ---
    for (const subTask of subTasks) {
      try {
        await axios.delete(
          `http://progress-service:4003/progress/task/individual/${subTask.id}`,
          {
            headers: {
              Authorization: req.headers.authorization,
            },
          }
        );
      } catch (err) {
        console.error(
          `Gagal menghapus progress subtask (${subTask.id}):`,
          err.response?.data || err.message
        );
      }
    }

    // 🔔 Notifikasi ke semua mahasiswa penerima
    for (const subTask of subTasks) {
      await publishMessage("task.deleted", {
        service: "task-service",
        type: "task.deleted",
        message: `Tugas "${masterTask.judul}" telah dihapus oleh ${name}.`,
        userId: subTask.assignedTo,
      });
    }

    // 🔔 Notifikasi ke dosen (konfirmasi)
    await publishMessage("task.deleted", {
      service: "task-service",
      type: "task.deleted",
      message: `${name} telah berhasil menghapus tugas "${masterTask.judul}`,
      userId: masterTask.createdBy,
    });

    res.status(200).json({
      success: true,
      message: `Tugas berhasil dihapus. ${deletedSubTasksCount} sub-tugas dan 1 masterTask dihapus.`,
    });
  } catch (error) {
    console.error("deleteTaskByMasterTaskId error:", error.message);
    res.status(500).json({ error: "Terjadi kesalahan saat menghapus tugas" });
  }
};

const deleteTaskById = async (req, res) => {
  const taskId = req.params.id;
  const { id: userId, role, name } = req.user;

  try {
    const task = await Task.findByPk(taskId);

    if (!task) {
      return res.status(404).json({ message: "Tugas tidak ditemukan" });
    }

    // ❌ Admin tidak boleh hapus, dan hanya pembuat (creator) yang boleh hapus
    if (task.createdBy !== userId) {
      return res.status(403).json({
        message:
          "Akses ditolak. Anda hanya bisa menghapus tugas yang Anda buat.",
      });
    }

    const taskTitle = task.judul;
    const assignedUserId = task.assignedTo;

    // Hapus task
    await task.destroy();

    // 2. Panggil progress-service untuk hapus progress terkait
    try {
      await axios.delete(
        `http://progress-service:4003/progress/task/individual/${taskId}`,
        {
          headers: {
            Authorization: req.headers.authorization, // kirim token dari user
          },
        }
      );
    } catch (err) {
      console.error(
        "Gagal menghapus progress di progress-service:",
        err.response?.data || err.message
      );
    }

    // 🔔 Notifikasi ke mahasiswa penerima
    if (assignedUserId) {
      await publishMessage("task.deleted", {
        service: "task-service",
        type: "task.deleted",
        message: `Tugas "${taskTitle}" telah dihapus oleh ${name}.`,
        userId: assignedUserId,
      });
    }

    // Kirim notifikasi
    await publishMessage("task.deleted", {
      service: "task-service",
      type: "task.deleted",
      message: `${name} telah berhasil menghapus tugas "${taskTitle}`,
      userId: task.createdBy,
    });

    res.json({ success: true, message: `Tugas ${taskTitle} berhasil dihapus` });
  } catch (error) {
    console.error("Error deleteTaskById:", error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

module.exports = {
  createTask,
  getAssignedTasksByMasterTaskId,
  getTasks,
  getTaskById,
  getTasksByClassId,
  getAllTasksConnectedToClass,
  getAllTasksWithoutClass,
  getTaskCountConnectedToClass,
  getTaskCountWithoutClass,
  updateTasksByMasterTaskId,
  updateTask,
  getTasksByStatus,
  deleteTaskByMasterTaskId,
  deleteTaskById,
};

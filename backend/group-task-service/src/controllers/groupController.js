const axios = require("axios");
// const Group = require("../models/Group");
// const GroupMember = require("../models/GroupMember");
const { Op } = require("sequelize");
const GroupTask = require("../models/GroupTask");
const { Group, GroupMember } = require("../models/index");
const { getUserById } = require("../services/userService");
const { getUserByEmail } = require("../services/userService");
const db = require("../config/database");

const { publishMessage } = require("../utils/rabbitmqPublisher");
const { publishToProgress } = require("../utils/progressPublisher");
const { getDeadlineStatus } = require("../utils/deadlineHelper");
const { getMahasiswaInClass } = require("../services/classService");

const createGroup = async (req, res) => {
  const { name } = req.body;
  const { classId } = req.params;
  const { id: creatorId, role, name: creatorName } = req.user;
  const token = req.headers.authorization?.split(" ")[1];

  try {
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Nama grup tidak boleh kosong." });
    }

    // Hanya dosen yang boleh membuat grup
    if (role !== "Dosen") {
      return res
        .status(403)
        .json({ error: "Hanya dosen yang dapat membuat grup." });
    }

    // (Opsional) Validasi classId ke class-service
    let mahasiswaList = [];
    if (classId) {
      const classResponse = await axios.get(
        `http://class-service:4006/class/${classId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!classResponse.data || !classResponse.data.class) {
        return res.status(400).json({ error: "Kelas tidak ditemukan." });
      }

      // Ambil semua mahasiswa di kelas
      mahasiswaList = await getMahasiswaInClass(classId, token);
    }

    // Buat group
    const group = await Group.create({
      name,
      createdBy: creatorId,
      creatorName,
      classId: classId || null, // Bisa null jika tidak ingin dikaitkan ke kelas
    });

    // 🔔 Notifikasi ke dosen pembuat
    await publishMessage("group.created", {
      service: "group-task-service",
      type: "group.created",
      message: `Grup "${group.name}" berhasil anda buat.`,
      userId: creatorId,
    });

    // 🔔 Notifikasi ke mahasiswa dalam kelas (jika ada)
    for (const mhs of mahasiswaList) {
      await publishMessage("group.created", {
        service: "group-task-service",
        type: "group.created",
        message: `Dosen ${creatorName} membuat grup "${group.name}".`,
        userId: mhs.id,
      });
    }

    res.status(201).json({
      success: true,
      message: "Group berhasil dibuat",
      group,
    });
  } catch (err) {
    console.error("CREATE GROUP ERROR:", err.message);
    res.status(500).json({ success: false, error: "Gagal membuat kelompok" });
  }
};

const addMember = async (req, res) => {
  const { email } = req.body;
  const { groupId } = req.params;
  const { id: requesterId, role } = req.user;
  const token = req.headers.authorization?.split(" ")[1];

  try {
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group tidak ditemukan" });
    }

    // ✅ Validasi hanya pembuat grup yang bisa menambahkan member
    if (group.createdBy !== requesterId) {
      return res
        .status(403)
        .json({ error: "Hanya pembuat grup yang bisa menambahkan anggota" });
    }

    const user = await getUserByEmail(email, "Mahasiswa", token);
    if (user.role !== "Mahasiswa") {
      return res
        .status(403)
        .json({ error: "Hanya mahasiswa yang bisa ditambahkan ke group" });
    }

    // ✅ Validasi: Jika grup terhubung ke kelas
    if (group.classId) {
      const classResponse = await axios.get(
        `http://class-service:4006/class/${group.classId}/members`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const classMembers = classResponse.data.members || [];
      const isMemberInClass = classMembers.some((m) => m.id === user.id);

      if (!isMemberInClass) {
        return res.status(403).json({
          error: "Mahasiswa tidak termasuk dalam anggota kelas ini",
        });
      }
    }

    // Cek duplikat
    const existing = await GroupMember.findOne({
      where: { groupId, userId: user.id },
    });
    if (existing) {
      return res
        .status(409)
        .json({ error: "User sudah menjadi anggota group" });
    }

    // ✅ Tambahkan user ke grup
    await GroupMember.create({
      groupId,
      userId: user.id,
      userName: user.name,
      joinedAt: new Date(),
    });

    // 🎯 Notifikasi untuk mahasiswa yang baru ditambahkan
    await publishMessage("group.member_added", {
      service: "group-task-service",
      type: "group.member_added",
      message: `Anda telah ditambahkan ke grup "${group.name}" oleh ${req.user.name}`,
      userId: user.id,
    });

    // 🎯 Kirim notifikasi ke RabbitMQ
    await publishMessage("group.member_added", {
      service: "group-task-service",
      type: "group.member_added",
      message: `User ${user.name} ditambahkan ke grup ID ${group.name}`,
      userId: requesterId,
    });

    res.status(201).json({
      success: true,
      message: "Anggota berhasil ditambahkan",
      member: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("JOIN GROUP ERROR:", err.message);
    res.status(500).json({ success: false, error: "Gagal bergabung kelompok" });
  }
};

const getAllGroups = async (req, res) => {
  const { id: userId, role } = req.user;
  const token = req.headers.authorization?.split(" ")[1];

  try {
    let groups = [];

    if (role === "Mahasiswa") {
      // Ambil semua groupId dari tabel anggota group di mana userId = mahasiswa ini
      const memberRecords = await GroupMember.findAll({
        where: { userId },
      });

      const groupIds = memberRecords.map((m) => m.groupId);

      if (groupIds.length > 0) {
        // Ambil detail grup dari groupId yang ditemukan
        groups = await Group.findAll({
          where: {
            id: groupIds,
          },
          order: [["createdAt", "DESC"]],
        });
      }
    } else if (role === "Dosen") {
      // Grup yang dibuat oleh dosen
      groups = await Group.findAll({
        where: { createdBy: userId },
        order: [["createdAt", "DESC"]],
      });
    } else {
      // Role lain misalnya admin, dikosongkan
      groups = [];
    }

    res.json({ success: true, groups });
  } catch (err) {
    console.error("GET USER GROUPS ERROR:", err.message);
    res.status(500).json({ error: "Gagal mengambil grup yang dimiliki" });
  }
};

const getGroupsByClass = async (req, res) => {
  const { classId } = req.params;
  const { id: userId, role } = req.user;

  try {
    let groups = [];

    if (role === "Dosen") {
      // Dosen hanya bisa melihat grup yang ia buat dalam kelas tersebut
      groups = await Group.findAll({
        where: {
          classId,
          createdBy: userId,
        },
        order: [["createdAt", "DESC"]],
      });
    } else if (role === "Mahasiswa") {
      // Cari semua groupId yang user ini ikuti
      const memberships = await GroupMember.findAll({
        where: { userId },
      });

      const groupIds = memberships.map((m) => m.groupId);

      if (groupIds.length > 0) {
        groups = await Group.findAll({
          where: {
            id: groupIds,
            classId, // hanya yang berasal dari kelas ini
          },
          order: [["createdAt", "DESC"]],
        });
      }
    } else {
      // Role lain tidak mendapat akses
      return res.status(403).json({ error: "Role tidak diizinkan." });
    }

    res.status(200).json({
      success: true,
      groups,
    });
  } catch (err) {
    console.error("GET GROUPS BY CLASS ERROR:", err.message);
    res.status(500).json({ error: "Gagal mengambil grup dari kelas" });
  }
};

const getMyGroups = async (req, res) => {
  const { id: userId, role } = req.user;

  try {
    let groups = [];

    if (role === "Mahasiswa") {
      // Ambil semua groupId yang user ini anggota
      const memberships = await GroupMember.findAll({
        where: { userId },
      });

      const groupIds = memberships.map((m) => m.groupId);

      if (groupIds.length > 0) {
        groups = await Group.findAll({
          where: { id: groupIds },
          order: [["createdAt", "DESC"]],
        });
      }
    } else if (role === "Dosen") {
      // Ambil semua grup yang dibuat dosen ini
      groups = await Group.findAll({
        where: { createdBy: userId },
        order: [["createdAt", "DESC"]],
      });
    } else {
      return res.status(403).json({ error: "Role tidak diizinkan." });
    }

    res.json({
      success: true,
      groups,
    });
  } catch (error) {
    console.error("GET MY GROUPS ERROR:", error.message);
    res.status(500).json({ error: "Gagal mengambil grup pengguna." });
  }
};

const getGroupsWithoutClass = async (req, res) => {
  const { id: userId, role } = req.user;

  try {
    let groups = [];

    if (role === "Dosen") {
      // Dosen: Ambil semua group yang dibuat oleh dia dan tidak punya classId
      groups = await Group.findAll({
        where: {
          createdBy: userId,
          classId: null,
        },
        order: [["createdAt", "DESC"]],
      });
    } else if (role === "Mahasiswa") {
      // Mahasiswa: Ambil semua groupId dari GroupMember
      const memberRecords = await GroupMember.findAll({
        where: { userId },
      });

      const groupIds = memberRecords.map((m) => m.groupId);

      // Ambil detail group dengan classId null
      if (groupIds.length > 0) {
        groups = await Group.findAll({
          where: {
            id: groupIds,
            classId: null,
          },
          order: [["createdAt", "DESC"]],
        });
      }
    } else {
      return res.status(403).json({ error: "Role tidak didukung." });
    }

    res.json({ success: true, groups });
  } catch (err) {
    console.error("GET GROUPS WITHOUT CLASS ERROR:", err.message);
    res.status(500).json({ error: "Gagal mengambil grup tanpa kelas" });
  }
};

const getGroupMembers = async (req, res) => {
  const groupId = req.params.groupId;
  const token = req.headers.authorization?.split(" ")[1];

  try {
    // Ambil data grup
    const group = await Group.findByPk(groupId);
    if (!group) return res.status(404).json({ error: "Grup tidak ditemukan" });

    // Ambil data pembuat grup (Dosen atau Mahasiswa)
    const creatorUser = await getUserById(group.createdBy, token);

    // hanya pemilik dan anggota group yang bisa melihat
    const isAuthorized = await GroupMember.findOne({
      where: { groupId, userId: req.user.id },
    });
    if (!isAuthorized && group.createdBy !== req.user.id) {
      return res.status(403).json({
        error:
          "Kamu tidak berhak melihat anggota grup ini. karena bukan pemilik atau anggota nya",
      });
    }

    // Ambil daftar anggota
    const members = await GroupMember.findAll({
      where: { groupId },
    });

    const memberResults = [];
    for (const member of members) {
      try {
        const user = await getUserById(member.userId, token);
        memberResults.push({
          id: user.id,
          name: user.name,
          email: user.email,
        });
      } catch (err) {
        console.error(
          `Gagal ambil user ${member.userId}:`,
          err.response?.data || err.message
        );
      }
    }

    res.json({
      success: true,
      message: "Informasi Group Members",
      group: {
        id: group.id,
        name: group.name,
        createdBy: {
          id: creatorUser.id,
          name: creatorUser.name,
        },
      },
      members: memberResults,
    });
  } catch (error) {
    console.error("GET GROUP MEMBERS ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil anggota grup",
    });
  }
};

const checkMembership = async (req, res) => {
  const { groupId, userId } = req.params;

  try {
    const member = await GroupMember.findOne({
      where: { groupId, userId },
    });

    const isMember = !!member;

    res.status(200).json({
      success: true,
      isMember,
    });
  } catch (error) {
    console.error("CHECK MEMBERSHIP ERROR:", error.message);
    res.status(500).json({
      success: false,
      error: "Gagal memeriksa keanggotaan",
    });
  }
};

const getGroupById = async (req, res) => {
  const { id } = req.params;

  try {
    const group = await Group.findOne({
      where: { id },
      include: [
        {
          model: GroupMember,
          as: "members",
          attributes: ["userId", "userName"], // tampilkan anggota
        },
      ],
    });

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Grup tidak ditemukan" });
    }

    res.status(200).json(group);
  } catch (error) {
    console.error("❌ Error getGroupById:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data grup" });
  }
};

const updateGroupName = async (req, res) => {
  const { groupId } = req.params;
  const { name } = req.body;
  const { id: requesterId, name: requesterName } = req.user;

  try {
    // Cek input
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Nama grup tidak boleh kosong." });
    }

    // Ambil data grup
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group tidak ditemukan." });
    }

    // Hanya pembuat grup yang bisa mengubah nama
    if (group.createdBy !== requesterId) {
      return res.status(403).json({ error: "Hanya pembuat grup yang bisa mengubah nama grup." });
    }

    const oldName = group.name;

    // Update nama grup
    group.name = name.trim();
    await group.save();

    // Ambil semua anggota grup untuk notifikasi
    const members = await GroupMember.findAll({
      where: { groupId },
      attributes: ["userId"],
    });

    for (const member of members) {
      await publishMessage("group.updated", {
        service: "group-task-service",
        type: "group.updated",
        message: `Nama grup "${oldName}" telah diubah menjadi "${name}" oleh ${requesterName}.`,
        userId: member.userId,
      });
    }

    // Notifikasi untuk pembuat
    await publishMessage("group.updated", {
      service: "group-task-service",
      type: "group.updated",
      message: `Anda berhasil mengubah nama grup dari "${oldName}" menjadi "${name}".`,
      userId: requesterId,
    });

    res.json({
      success: true,
      message: "Nama grup berhasil diubah",
      group,
    });

  } catch (err) {
    console.error("UPDATE GROUP ERROR:", err.message);
    res.status(500).json({ success: false, error: "Gagal mengubah nama grup" });
  }
};


const addGroupTask = async (req, res) => {
  const { groupId } = req.params;
  const { judul, description, deadline } = req.body;
  const { id: userId, role } = req.user;
  const token = req.headers.authorization?.split(" ")[1];

  try {
    // ✅ Validasi field wajib diisi
    if (!judul || !description || !deadline) {
      return res.status(400).json({
        error: "Semua field wajib diisi",
      });
    }

    // Validasi deadline harus tanggal masa depan
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
      return res
        .status(400)
        .json({ error: "Deadline tidak valid atau sudah lewat" });
    }

    // Admin tidak boleh buat tugas
    if (role === "Admin") {
      return res
        .status(403)
        .json({ error: "Admin tidak diperbolehkan membuat tugas" });
    }

    // Cek apakah grup ada
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ error: "Grup tidak ditemukan" });
    }

    // Validasi: hanya pembuat grup yang boleh menambahkan tugas
    if (group.createdBy !== userId) {
      return res
        .status(403)
        .json({ error: "Hanya pembuat grup yang bisa menambahkan tugas" });
    }

    // Ambil semua anggota grup
    const groupMembers = await GroupMember.findAll({ where: { groupId } });

    // Periksa apakah hanya ketua saja (1 anggota total)
    if (!groupMembers || groupMembers.length <= 1) {
      return res.status(400).json({
        error:
          "Tidak bisa membuat tugas. Tambahkan minimal dua anggota ke dalam grup terlebih dahulu. ketua dan anggota",
      });
    }

    // Buat tugas
    const task = await GroupTask.create({
      groupId,
      judul,
      description,
      deadline,
      status: "Pending",
      createdBy: userId,
      // assignedTo,
    });

    // Ambil nama dosen/pembuat
    let dosenName = req.user.name || "Dosen";
    try {
      const dosenRes = await axios.get(
        `http://user-service:4000/users/${userId}`, // ← ini ID dosen
        {
          headers: { Authorization: req.headers.authorization },
        }
      );
      dosenName = dosenRes.data.name;
    } catch (err) {
      console.warn(`⚠️ Gagal mengambil nama dosen dengan ID ${userId}`);
    }

    // Kirim data ke progress-service untuk semua anggota grup
    for (const member of groupMembers) {
      let userName = "Anggota";

      try {
        const userRes = await axios.get(
          `http://user-service:4000/users/${member.userId}`,
          {
            headers: { Authorization: req.headers.authorization },
          }
        );
        userName = userRes.data.name;
      } catch (err) {
        console.warn(`⚠️ Gagal mengambil nama user dengan ID ${member.userId}`);
      }

      console.log("📤 Data dikirim ke progress-service:", {
        taskId: task.id,
        userId: member.userId,
        userName,
        dosenName, // ini bagaimana cara mengaturnya
        taskType: "Group",
        createdBy: task.createdBy,
        assignedTo: member.userId,
        groupId: task.groupId,
      });

      await publishToProgress(
        task.id,
        member.userId,
        userName,
        dosenName,
        "Group",
        task.createdBy,
        member.userId,
        task.groupId
      );

      // 🎯 Notifikasi ke mahasiswa anggota grup
      await publishMessage("group.task_created", {
        service: "group-task-service",
        type: "group.task_created",
        message: `Anda mendapatkan tugas grup "${task.judul}" di grup "${group.name}" dari ${dosenName}`,
        userId: member.userId,
      });
    }

    // Kirim notifikasi ke RabbitMQ
    await publishMessage("group.task_created", {
      service: "group-task-service",
      type: "group.task_created",
      message: `Tugas grup ${group.name} dengan judul tugas "${task.judul}" telah dibuat.`,
      userId: task.createdBy,
    });

    // Berhasil
    res
      .status(201)
      .json({ success: true, message: "Group task created", task });
    // console.log("✅ Tugas berhasil dibuat:", task);
  } catch (err) {
    console.error("Add Group Task ERROR :", err);
    res.status(500).json({ success: false, error: "Gagal menambahkan tugas" });
  }
};

const getGroupTasks = async (req, res) => {
  const { id } = req.params;
  try {
    const tasks = await GroupTask.findAll({
      where: { groupId: id },
      order: [["createdAt", "DESC"]],
    });

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tidak ada tugas untuk grup ini.",
        data: [],
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
      message: "Tugas berhasil diambil.",
      data: tasksWithStatus,
    });
  } catch (error) {
    console.error("Error getGroupTasks:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil tugas grup.",
      error: error.message,
    });
  }
};

const getTaskByGroupAndId = async (req, res) => {
  try {
    const { groupId, taskId } = req.params;

    const task = await GroupTask.findOne({
      where: {
        id: taskId,
        groupId: groupId,
      },
    });

    if (!task) {
      return res
        .status(404)
        .json({ message: "Tugas tidak ditemukan di grup ini." });
    }

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

    res.json({
      success: true,
      message: "Tugas berhasil ditemukan.",
      data: taskJSON,
    });
  } catch (error) {
    console.error("❌ Gagal mengambil tugas:", error.message);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil tugas.",
      error: error.message,
    });
  }
};

const getGroupDetails = async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;
  const { role, name } = req.user;
  const token = req.headers.authorization?.split(" ")[1];

  try {
    if (!token) {
      return res.status(401).json({ error: "Token tidak ditemukan di header" });
    }

    // Cek apakah grup ada
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ error: "Grup tidak ditemukan" });
    }

    // Cek apakah user adalah pembuat grup atau anggota grup
    const isCreator = group.createdBy === userId;
    const isMember = await GroupMember.findOne({
      where: { groupId, userId },
    });

    if (!isCreator && !isMember && role !== "admin") {
      return res
        .status(403)
        .json({ error: "Kamu tidak punya akses ke grup ini" });
    }

    // Ambil data pembuat grup dari user-service
    const creator = await getUserById(group.createdBy, token);

    // Ambil anggota grup
    const membersRaw = await GroupMember.findAll({ where: { groupId } });

    const members = [];
    for (const m of membersRaw) {
      try {
        const user = await getUserById(m.userId, token);
        members.push({
          id: user.id,
          name: user.name,
          email: user.email,
        });
      } catch (err) {
        console.error(`Gagal ambil user ${m.userId}:`, err.message);
      }
    }

    // Ambil tugas-tugas grup
    let tasks;
    if (isCreator) {
      // Dosen atau admin bisa lihat semua tugas
      tasks = await GroupTask.findAll({
        where: { groupId },
        order: [["createdAt", "DESC"]],
      });
    } else {
      // Mahasiswa hanya bisa lihat tugas yang dibuat setelah mereka join
      const self = await GroupMember.findOne({ where: { groupId, userId } });

      if (!self) {
        return res
          .status(403)
          .json({ error: "Data keanggotaan tidak ditemukan" });
      }

      // Ambil tugas-tugas grup
      tasks = await GroupTask.findAll({
        where: {
          groupId,
          createdAt: {
            [Op.gte]: self.joinedAt,
          },
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

    res.json({
      success: true,
      message: "Informasi Detail Group",
      group: {
        id: group.id,
        name: group.name,
        dosenName: group.dosenName || null,
        createdBy: {
          id: creator.id,
          name: creator.name,
          email: creator.email,
          role: creator.role,
        },
      },
      members,
      tasksWithStatus,
    });
  } catch (err) {
    console.error("Get Group Detail STATUS ERROR:", err.message);
    res.status(500).json({ success: false, error: "Gagal ambil detail grup" });
  }
};

const updateGroupTask = async (req, res) => {
  try {
    const { groupId, taskId } = req.params;
    const { judul, description, deadline } = req.body;
    const { id: requesterId } = req.user;

    // Ambil task yang sesuai group
    const task = await GroupTask.findOne({
      where: { id: taskId, groupId },
    });
    if (!task) {
      return res.status(404).json({ error: "Tugas tidak ditemukan di grup ini." });
    }

    // Ambil grup
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ error: "Grup tidak ditemukan." });
    }

    // Hanya pembuat grup yang boleh mengedit
    if (group.createdBy !== requesterId) {
      return res.status(403).json({ error: "Hanya pembuat grup yang bisa mengubah tugas." });
    }

    // Flag untuk cek apakah ada perubahan
    let updated = false;

    // Update judul jika ada
    if (typeof judul === "string" && judul.trim() !== "" && judul.trim() !== task.judul) {
      task.judul = judul.trim();
      updated = true;
    }

    // Update deskripsi jika ada
    if (typeof description === "string" && description.trim() !== "" && description.trim() !== task.description) {
      task.description = description.trim();
      updated = true;
    }

    // Update deadline jika ada
    if (deadline) {
      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
        return res.status(400).json({ error: "Deadline tidak valid atau sudah lewat" });
      }
      if (deadlineDate.toISOString() !== new Date(task.deadline).toISOString()) {
        task.deadline = deadlineDate;
        updated = true;
      }
    }

    // Kalau tidak ada perubahan, langsung return
    if (!updated) {
      return res.status(400).json({ error: "Tidak ada perubahan pada tugas." });
    }

    await task.save();

    // Ambil semua anggota grup
    const members = await GroupMember.findAll({
      where: { groupId },
      attributes: ["userId"],
    });

    // Kirim notifikasi ke semua anggota grup
    for (const member of members) {
      await publishMessage("group.task_updated", {
        service: "group-task-service",
        type: "group.task_updated",
        message: `Tugas "${task.judul}" di grup "${group.name}" telah diperbarui.`,
        userId: member.userId,
      });
    }

    // Notifikasi untuk pembuat
    await publishMessage("group.task_updated", {
      service: "group-task-service",
      type: "group.task_updated",
      message: `Anda berhasil mengubah Tugas "${task.judul}" di grup "${group.name}".`,
      userId: requesterId,
    });

    res.json({
      success: true,
      message: "Tugas berhasil diperbarui",
      data: task,
    });
  } catch (error) {
    console.error("UPDATE GROUP TASK ERROR:", error);
    res.status(500).json({ success: false, error: "Gagal memperbarui tugas" });
  }
};

const deleteGroupTask = async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user.id;

  try {
    // 🔍 Cari tugas
    const task = await GroupTask.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ error: "Tugas tidak ditemukan" });
    }

    // 🔍 Cek apakah user adalah pembuat grup
    const group = await Group.findByPk(task.groupId);
    if (!group || group.createdBy !== userId) {
      return res
        .status(403)
        .json({ error: "Kamu bukan pembuat grup, tidak bisa hapus tugas" });
    }

    // 🔍 Ambil semua anggota grup
    const groupMembers = await GroupMember.findAll({
      where: { groupId: group.id },
    });

    // 🗑️ Hapus tugasnya
    await GroupTask.destroy({ where: { id: taskId } });

    // 2. Panggil progress-service untuk hapus progress terkait
    try {
      await axios.delete(
        `http://progress-service:4003/progress/task/group/${taskId}`,
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

    // 📢 Notifikasi ke semua mahasiswa anggota grup
    for (const member of groupMembers) {
      await publishMessage("group.task_deleted", {
        service: "group-task-service",
        type: "group.task_deleted",
        message: `Tugas grup "${task.judul}" di grup "${group.name}" telah dihapus oleh ${req.user.name}`,
        userId: member.userId,
      });
    }

    // 📢 Notifikasi ke pembuat/dosen
    await publishMessage("group.task_deleted", {
      service: "group-task-service",
      type: "group.task_deleted",
      message: `Tugas grup dengan judul "${task.judul}" di grup "${group.name}" telah berhasil dihapus`,
      userId,
    });

    res.json({ success: true, message: "Tugas berhasil dihapus" });
  } catch (err) {
    console.error("DELETE GROUP TASK ERROR:", err.message);
    res.status(500).json({ error: "Gagal menghapus tugas" });
  }
};

const deleteGroup = async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  try {
    // 🔍 Cek apakah grup ada
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ error: "Grup tidak ditemukan" });
    }

    // 🔒 Hanya pembuat grup yang boleh menghapus
    if (group.createdBy !== userId) {
      return res
        .status(403)
        .json({ error: "Kamu bukan pembuat grup, tidak bisa menghapus" });
    }

    // 🗑️ Hapus data terkait: comments → tasks → members → grup
    const tasks = await GroupTask.findAll({ where: { groupId } });

    // Hapus semua tugas
    await GroupTask.destroy({ where: { groupId } });

    // Hapus semua anggota
    await GroupMember.destroy({ where: { groupId } });

    // Hapus grup itu sendiri
    await Group.destroy({ where: { id: groupId } });

    // Notifikasi (opsional)
    await publishMessage("group.deleted", {
      service: "group-task-service",
      type: "group.deleted",
      message: `Grup "${group.name}" telah berhasil anda hapus`,
      userId,
    });

    res.json({ success: true, message: "Grup berhasil dihapus." });
  } catch (err) {
    console.error("DELETE GROUP ERROR:", err.message);
    res.status(500).json({ error: "Gagal menghapus grup" });
  }
};

module.exports = {
  createGroup,
  addMember,
  getAllGroups,
  getMyGroups,
  getGroupsByClass,
  getGroupsWithoutClass,
  getGroupMembers,
  checkMembership,
  getGroupById,
  updateGroupName,

  getGroupTasks,
  addGroupTask,
  getTaskByGroupAndId,
  getGroupDetails,
  updateGroupTask,
  deleteGroupTask,
  deleteGroup,
};

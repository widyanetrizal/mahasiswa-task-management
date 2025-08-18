const axios = require("axios");
const Class = require("../models/classModel");
const ClassMember = require("../models/classMember");
const userService = require("../services/userService");
const { getUserById } = require("../services/userService");
const { getUserByEmail } = require("../services/userService");
const db = require("../config/database");
const { publishMessage } = require("../utils/rabbitmqPublisher");

const createClass = async (req, res) => {
  const { name, mataKuliah } = req.body;
  const { id: creatorId, role, name: creatorName } = req.user;

  try {
    // Validasi input
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Nama kelas tidak boleh kosong." });
    }

    const existingClass = await Class.findOne({
      where: {
        name,
        mataKuliah,
        createdBy: creatorId,
      },
    });
    if (existingClass) {
      return res
        .status(409)
        .json({ error: "Kelas dengan nama dan mata kuliah ini sudah ada." });
    }

    // Hanya dosen yang boleh membuat kelas
    if (role !== "Dosen") {
      return res
        .status(403)
        .json({ error: "Hanya dosen yang boleh membuat kelas." });
    }

    // Buat kelas
    const newClass = await Class.create({
      name,
      mataKuliah,
      createdBy: creatorId,
      creatorName,
    });

    // Kirim notifikasi ke RabbitMQ
    await publishMessage("class.created", {
      service: "class-service",
      type: "class.created",
      message: `Kelas "${newClass.name}" berhasil dibuat oleh ${creatorName}`,
      userId: creatorId,
    });

    res.status(201).json({
      success: true,
      message: "Kelas berhasil dibuat.",
      class: newClass,
    });
  } catch (error) {
    console.error("CREATE CLASS ERROR:", error.message);
    res.status(500).json({ error: "Gagal membuat kelas." });
  }
};

const addStudentsToClass = async (req, res) => {
  const { id: requesterId, role } = req.user;
  const { emails } = req.body; // Array email mahasiswa
  const { classId } = req.params;
  const token = req.headers.authorization?.split(" ")[1];

  try {
    const kelas = await Class.findByPk(classId);
    if (!kelas) {
      return res.status(404).json({ error: "Kelas tidak ditemukan" });
    }

    // ✅ Hanya dosen & pembuat kelas yang boleh menambahkan
    if (role !== "Dosen" || kelas.createdBy !== requesterId) {
      return res.status(403).json({
        error: "Hanya dosen pembuat kelas yang boleh menambahkan mahasiswa",
      });
    }

    const results = [];

    for (const email of emails) {
      try {
        const mahasiswa = await getUserByEmail(email, "Mahasiswa", token);

        const exists = await ClassMember.findOne({
          where: { classId, studentId: mahasiswa.id },
        });

        if (exists) {
          results.push({
            email,
            status: "sudah tergabung",
          });
        } else {
          await ClassMember.create({
            classId,
            studentId: mahasiswa.id,
            userName: mahasiswa.name,
          });

          // 🔔 Kirim notifikasi ke mahasiswa yang ditambahkan
          await publishMessage("class.student.added", {
            service: "class-service",
            type: "class.student.added",
            message: `Anda telah ditambahkan ke kelas "${kelas.name}" oleh ${req.user.name}`,
            userId: mahasiswa.id,
          });

          // 🔔 Kirim notifikasi ke dosen (opsional)
          await publishMessage("class.student.added", {
            service: "class-service",
            type: "class.student.added",
            message: `Mahasiswa ${mahasiswa.name} telah ditambahkan ke kelas "${kelas.name}"`,
            userId: requesterId,
          });

          results.push({
            email,
            status: "berhasil ditambahkan",
          });
        }
      } catch (err) {
        results.push({
          email,
          status: "gagal",
          reason: err.message,
        });
      }
    }

    res.json({
      success: true,
      classId,
      addedBy: requesterId,
      result: results,
    });
  } catch (err) {
    console.error("ADD STUDENT ERROR:", err.message);
    res.status(500).json({ error: "Gagal menambahkan mahasiswa ke kelas" });
  }
};

const getMyClasses = async (req, res) => {
  const { id: userId, role } = req.user;

  try {
    // === Jika Dosen: ambil kelas yang dibuat ===
    if (role === "Dosen") {
      const classes = await Class.findAll({
        where: { createdBy: userId },
        attributes: ["id", "name", "mataKuliah", "createdAt"],
        order: [["createdAt", "DESC"]],
      });

      return res.json({
        success: true,
        role,
        count: classes.length,
        classes,
      });
    }

    // === Jika Mahasiswa: ambil kelas yang diikuti ===
    if (role === "Mahasiswa") {
      const memberships = await ClassMember.findAll({
        where: { studentId: userId },
        attributes: ["classId"],
      });

      const classIds = memberships.map((m) => m.classId);

      if (classIds.length === 0) {
        return res.json({
          success: true,
          role,
          message: "Anda belum mengikuti kelas apa pun.",
          classes: [],
        });
      }

      const classes = await Class.findAll({
        where: { id: classIds },
        attributes: ["id", "name", "mataKuliah", "creatorName", "createdAt"],
        order: [["createdAt", "DESC"]],
      });

      return res.json({
        success: true,
        role,
        count: classes.length,
        classes,
      });
    }

    // === Jika bukan Mahasiswa atau Dosen ===
    return res.status(403).json({
      error: "Role tidak diizinkan untuk mengakses daftar kelas.",
    });
  } catch (error) {
    console.error("GET MY CLASSES ERROR:", error.message);
    res.status(500).json({ error: "Gagal mengambil daftar kelas." });
  }
};

const getClassMembers = async (req, res) => {
  const classId = req.params.id;
  const token = req.headers.authorization?.split(" ")[1];

  try {
    const kelas = await Class.findByPk(classId);
    if (!kelas) {
      return res.status(404).json({ error: "Kelas tidak ditemukan" });
    }

    const members = await ClassMember.findAll({ where: { classId } });

    // Jika hanya butuh userId:
    const studentIds = members.map((m) => m.studentId);
    // return res.json({ classId, userIds });

    // Jika ingin detail user dari user-service:
    const userDetails = await Promise.all(
      studentIds.map(async (id) => {
        const res = await axios.get(`http://user-service:4000/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
      })
    );

    return res.json({
      classId,
      members: userDetails,
    });
  } catch (err) {
    console.error("GET CLASS MEMBERS ERROR:", err.message);
    res.status(500).json({ error: "Gagal mengambil anggota kelas" });
  }
};

const getClassInfo = async (req, res) => {
  const { classId } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  try {
    // Cari kelas
    const kelas = await Class.findByPk(classId);
    if (!kelas) {
      return res.status(404).json({ error: "Kelas tidak ditemukan" });
    }

    // Cek apakah user adalah creator kelas
    const isCreator = kelas.createdBy === userId;

    // Cek apakah user adalah member kelas
    const isMember = await ClassMember.findOne({
      where: { classId, studentId: userId },
    });

    if (!isCreator && !isMember) {
      return res
        .status(403)
        .json({ error: "Akses ditolak. Bukan anggota kelas." });
    }

    // Cari semua anggota kelas
    const members = await ClassMember.findAll({
      where: { classId },
      attributes: ["studentId", "userName"],
    });

    // Bentuk response data
    const response = {
      id: kelas.id,
      name: kelas.name,
      mataKuliah: kelas.mataKuliah,
      createdBy: {
        id: kelas.createdBy,
        name: kelas.creatorName,
      },
      members: members.map((m) => ({
        id: m.studentId,
        name: m.userName,
      })),
    };

    res.json({
      success: true,
      class: response,
    });
  } catch (error) {
    console.error("GET CLASS INFO ERROR:", error.message);
    res.status(500).json({ error: "Gagal mengambil informasi kelas." });
  }
};

const updateClass = async (req, res) => {
  const { classId } = req.params; // ID kelas
  const { name, mataKuliah } = req.body;
  const userId = req.user?.id; // diasumsikan sudah ada middleware auth
  const userRole = req.user?.role;

  try {
    // Cari kelas
    const kelas = await Class.findByPk(classId);
    if (!kelas) {
      return res.status(404).json({ error: "Kelas tidak ditemukan." });
    }

    // Cek apakah user adalah dosen dan pencipta kelas
    if (userRole !== "Dosen" || kelas.createdBy !== userId) {
      return res
        .status(403)
        .json({ error: "Anda tidak memiliki izin untuk mengubah kelas ini." });
    }

    // Update data
    kelas.name = name || kelas.name;
    kelas.mataKuliah = mataKuliah || kelas.mataKuliah;
    await kelas.save();

    const members = await ClassMember.findAll({ where: { classId } });
    for (const m of members) {
      await publishMessage("class.updated", {
        service: "class-service",
        type: "class.updated",
        message: `Informasi kelas "${kelas.name}" telah diperbarui oleh ${req.user.name}`,
        userId: m.studentId,
      });
    }

    // Kirim notifikasi ke dosen sendiri
    await publishMessage("class.updated", {
      service: "class-service",
      type: "class.updated",
      message: `Anda telah berhasil memperbarui informasi kelas "${kelas.name}" dan "${kelas.mataKuliah}".`,
      userId: userId,
    });

    res.json({
      success: true,
      message: "Informasi kelas berhasil diperbarui.",
      data: {
        id: kelas.id,
        name: kelas.name,
        mataKuliah: kelas.mataKuliah,
      },
    });
  } catch (error) {
    console.error("UPDATE CLASS ERROR:", error.message);
    res.status(500).json({ error: "Gagal memperbarui kelas." });
  }
};

const removeStudentFromClass = async (req, res) => {
  const { id: requesterId, role, name: requesterName } = req.user;
  const { classId, studentId } = req.params;

  try {
    const kelas = await Class.findByPk(classId);
    if (!kelas) {
      return res.status(404).json({ error: "Kelas tidak ditemukan" });
    }

    // Validasi hanya dosen pembuat kelas yang bisa menghapus anggota
    if (role !== "Dosen" || kelas.createdBy !== requesterId) {
      return res.status(403).json({
        error:
          "Anda tidak memiliki izin untuk menghapus anggota dari kelas ini.",
      });
    }

    const member = await ClassMember.findOne({ where: { classId, studentId } });
    if (!member) {
      return res
        .status(404)
        .json({ error: "Mahasiswa tidak tergabung dalam kelas ini." });
    }

    await member.destroy();

    await publishMessage("class.student.removed", {
      service: "class-service",
      type: "class.student.removed",
      message: `Anda telah dikeluarkan dari kelas "${kelas.name}" oleh ${req.user.name}`,
      userId: parseInt(studentId),
    });

    // 🔔 Notifikasi ke dosen/penghapus
    await publishMessage("class.student.removed", {
      service: "class-service",
      type: "class.student.removed",
      message: `Anda berhasil menghapus mahasiswa (ID: ${studentId}) dari kelas "${kelas.name}".`,
      userId: requesterId,
    });

    res.json({
      success: true,
      message: `Mahasiswa berhasil dihapus dari kelas ${kelas.name}.`,
    });
  } catch (err) {
    console.error("REMOVE STUDENT ERROR:", err.message);
    res.status(500).json({ error: "Gagal menghapus mahasiswa dari kelas." });
  }
};

const getClassCount = async (req, res) => {
  const { id: userId, role } = req.user;

  try {
    if (role === "Dosen") {
      // Hitung kelas yang dibuat dosen
      const count = await Class.count({
        where: { createdBy: userId },
      });
      return res.json({
        success: true,
        role,
        count,
        message: `Jumlah kelas yang dibuat dosen: ${count}`,
      });
    }

    if (role === "Mahasiswa") {
      // Hitung kelas yang diikuti mahasiswa
      const memberships = await ClassMember.findAll({
        where: { studentId: userId },
        attributes: ["classId"],
      });

      const count = memberships.length;

      return res.json({
        success: true,
        role,
        count,
        message: `Jumlah kelas yang diikuti mahasiswa: ${count}`,
      });
    }

    // Role lain tidak diizinkan
    return res.status(403).json({
      success: false,
      error: "Role tidak diizinkan mengakses jumlah kelas.",
    });
  } catch (error) {
    console.error("GET CLASS COUNT ERROR:", error.message);
    res.status(500).json({
      success: false,
      error: "Gagal mengambil jumlah kelas.",
    });
  }
};

const deleteClass = async (req, res) => {
  const { id: requesterId, role, name: requesterName } = req.user;
  const { classId } = req.params;

  try {
    const kelas = await Class.findByPk(classId);
    if (!kelas) {
      return res.status(404).json({ error: "Kelas tidak ditemukan" });
    }

    // Validasi hanya dosen pembuat kelas yang boleh menghapus kelas
    if (role !== "Dosen" || kelas.createdBy !== requesterId) {
      return res
        .status(403)
        .json({ error: "Anda tidak memiliki izin untuk menghapus kelas ini." });
    }

    // Hapus semua anggota dari kelas terlebih dahulu
    await ClassMember.destroy({ where: { classId } });

    // Hapus kelas
    await kelas.destroy();

    // 🔹 Ambil semua anggota kelas sebelum dihapus
    const members = await ClassMember.findAll({ where: { classId } });

    // 🔔 Notifikasi ke semua mahasiswa bahwa kelas dihapus
    for (const m of members) {
      await publishMessage("class.deleted", {
        service: "class-service",
        type: "class.deleted",
        message: `Kelas "${kelas.name}" telah dihapus oleh ${req.user.name}`,
        userId: m.studentId,
      });
    }

    // 🔔 Notifikasi ke dosen yang menghapus (konfirmasi)
    await publishMessage("class.deleted", {
      service: "class-service",
      type: "class.deleted",
      message: `Anda berhasil menghapus kelas "${kelas.name}" beserta seluruh anggotanya.`,
      userId: requesterId,
    });

    res.json({
      success: true,
      message: `Kelas ${kelas.name} berhasil dihapus.`,
    });
  } catch (err) {
    console.error("DELETE CLASS ERROR:", err.message);
    res.status(500).json({ error: "Gagal menghapus kelas." });
  }
};

module.exports = {
  createClass,
  addStudentsToClass,
  getMyClasses,
  getClassMembers,
  getClassInfo,
  updateClass,
  removeStudentFromClass,
  getClassCount,
  deleteClass,
};

const Progress = require("../models/Progress");
const { Op } = require("sequelize");
const axios = require("axios");
require("dotenv").config();
const { sendNotification } = require("../services/notificationService");
const { publishMessage } = require("../utils/rabbitmqPublisher");
const { publishStatusUpdate } = require("../utils/statusPublisher");
const { uploadFileToS3 } = require("../utils/s3");
const { deleteFileFromS3 } = require("../utils/s3");

const updateProgress = async (req, res) => {
  try {
    console.log("=== updateProgress ===");
    console.log("req.file:", req.file); // cek apakah file berhasil diterima multer
    console.log("req.body:", req.body); // cek data form selain file

    const { id } = req.params;
    const { id: requesterId, role } = req.user;
    const token = req.headers.authorization?.split(" ")[1];

    // const {
    //   progress: newProgress,
    //   status: newStatus,
    //   description,
    //   // gdriveLink,
    // } = req.body;

    let newProgress = req.body.progress ? Number(req.body.progress) : undefined;
    let newStatus = req.body.status || undefined;
    let description = req.body.description || undefined;

    // 🔍 Cari progress yang akan diupdate
    const oldProgress = await Progress.findByPk(id);
    if (!oldProgress) {
      return res.status(404).json({ message: "Progress tidak ditemukan" });
    }

    // 🔒 Validasi: hanya mahasiswa yang bisa update
    if (role !== "Mahasiswa") {
      return res.status(403).json({
        success: false,
        message: "Anda tidak diizinkan mengubah progress ini.",
      });
    }

    let finalProgress = oldProgress.progress;
    let finalStatus = oldProgress.status;

    // ✅ Jika hanya progress yang diberikan
    // if (typeof newProgress === "number" && !newStatus) {
    if (!isNaN(newProgress) && !newStatus) {
      if (newProgress <= 0) {
        finalProgress = 0;
        finalStatus = "Pending";
      } else if (newProgress >= 100) {
        return res.status(400).json({
          success: false,
          message:
            "Progress 100% hanya bisa diberikan oleh dosen saat menilai.",
        });
      } else {
        finalProgress = newProgress;
        finalStatus = "In-Progress";
      }
    }

    const lastProgress = await Progress.findOne({
      where: {
        taskId: oldProgress.taskId,
        userId: oldProgress.userId,
      },
      order: [["createdAt", "DESC"]],
    });

    if (lastProgress && finalProgress < lastProgress.progress) {
      return res.status(400).json({
        success: false,
        message: `Progress tidak boleh mundur. Progress terakhir adalah ${lastProgress.progress}%`,
      });
    }

    // 🔍 Ambil nama user yang sedang update
    let currentUserName = "Mahasiswa";
    try {
      const userRes = await axios.get(
        `http://user-service:4000/users/${requesterId}`,
        {
          // headers: { Authorization: req.headers.authorization },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      currentUserName = userRes.data.name;
    } catch (err) {
      console.warn("⚠️ Gagal mengambil nama user saat ini");
    }

    // Upload file ke S3 jika ada
    let s3Key = null;
    let fileUrl = null;
    if (req.file) {
      const uploaded = await uploadFileToS3(req.file); // sekarang kembalikan {key, publicUrl}
      s3Key = uploaded.key;
      fileUrl = uploaded.publicUrl;
    }

    // ✅ Simpan sebagai riwayat baru (insert, bukan update)
    const newEntry = await Progress.create({
      taskType: oldProgress.taskType,
      taskId: oldProgress.taskId,
      userId: oldProgress.userId,
      userName: currentUserName,
      // dosenName: oldProgress.dosenName,
      createdBy: lastProgress?.createdBy,
      assignedTo: oldProgress.userId,
      progress: finalProgress,
      status: finalStatus,
      description,
      document: fileUrl,
      s3Key:s3Key,
    });

    await publishStatusUpdate(newEntry);

    // Kirim ke notifikasi-service
    await publishMessage("progress.updated", {
      service: "progress-service",
      type: "progress.updated",
      message: `Progress tugas berhasil di update, sekarang: ${finalProgress}%, status: ${finalStatus}`,
      userId: newEntry.userId,
    });

    // 📢 Notifikasi ke pembuat tugas (createdBy)
    if (newEntry.createdBy && newEntry.createdBy !== newEntry.userId) {
      await publishMessage("progress.updated", {
        service: "progress-service",
        type: "progress.updated",
        message: `${currentUserName} telah mengupdate progress tugas menjadi ${finalProgress}% (status: ${finalStatus}).`,
        userId: newEntry.createdBy,
      });
    }

    res.json({
      success: true,
      message: "Progress berhasil diperbarui.",
      // data: newEntry,
      data: { ...newEntry.toJSON(), fileUrl },
    });
  } catch (error) {
    console.error("❌ Gagal update progress:", error.message);
    res.status(500).json({
      success: false,
      message: "Gagal update progress",
      error: error.message,
    });
  }
};

const addCommentByDosen = async (req, res) => {
  try {
    console.log("=== addCommentByDosen ===");
    console.log("req.file:", req.file);
    console.log("req.body:", req.body);

    const { id } = req.params;
    const { dosenComment, action, grade } = req.body;
    const { id: dosenId, role } = req.user;
    const token = req.headers.authorization?.split(" ")[1];

    // Validasi peran
    if (role !== "Dosen") {
      return res
        .status(403)
        .json({ message: "Hanya dosen yang boleh memberikan komentar" });
    }

    // Ambil data progress yang dimaksud
    const oldProgress = await Progress.findByPk(id);
    if (!oldProgress) {
      return res.status(404).json({ message: "Progress tidak ditemukan" });
    }

    // Validasi dosen adalah pembuat tugas ini
    if (oldProgress.createdBy !== dosenId || role !== "Dosen") {
      return res.status(403).json({ message: "Anda bukan pembuat tugas ini" });
    }

    let finalStatus = oldProgress.status;
    let newComment = null;
    let newGrade = null;
    // let finalGdriveLink = null;

    if (action === "Revisi") {
      // Komentar wajib, nilai tidak boleh diberikan
      if (!dosenComment || dosenComment.trim() === "") {
        return res
          .status(400)
          .json({ message: "Komentar wajib diisi saat memberi revisi." });
      }
      if (grade !== undefined && grade !== null && grade !== "") {
        return res
          .status(400)
          .json({ message: "Nilai tidak boleh diberikan saat revisi." });
      }

      finalStatus = "Revisi";
      newComment = dosenComment;
    } else if (action === "Done") {
      // Komentar tidak wajib, nilai opsional
      finalStatus = "Done";

      if (dosenComment && dosenComment.trim() !== "") {
        newComment = dosenComment;
      }

      if (grade !== undefined && grade !== null && grade !== "") {
        if (isNaN(grade) || grade < 0 || grade > 100) {
          return res.status(400).json({
            message: "Nilai harus berupa angka antara 0–100.",
          });
        }
        newGrade = parseInt(grade);
      }
    } else {
      return res
        .status(400)
        .json({ message: "Action tidak valid. Gunakan 'Revisi' atau 'Done'" });
    }

    // Gunakan progress terakhir sebagai referensi
    const lastProgress = await Progress.findOne({
      where: {
        taskId: oldProgress.taskId,
        userId: oldProgress.userId,
      },
      order: [["createdAt", "DESC"]],
    });

    if (action === "Revisi" && lastProgress?.status === "Done") {
      return res.status(400).json({
        message: "Progress sudah selesai. Tidak bisa direvisi lagi.",
      });
    }

    if (action === "Done" && lastProgress?.status === "Done") {
      return res.status(400).json({
        message: "Tugas sudah ditandai Done, tidak bisa diubah lagi.",
      });
    }

    finalProgress =
      finalStatus === "Done" ? 100 : lastProgress ? lastProgress.progress : 0;

    // if (gdriveLink && gdriveLink.trim() !== "") {
    //   finalGdriveLink = gdriveLink.trim();
    // }

    // ✅ Ambil nama dosen yang login sekarang
    let currentDosenName = "Dosen";
    try {
      const userRes = await axios.get(
        `http://user-service:4000/users/${dosenId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      currentDosenName = userRes.data.name;
    } catch (err) {
      console.warn("⚠️ Gagal mengambil nama dosen saat ini");
    }

    // Upload file ke S3 jika ada
    let s3Key = null;
    let fileUrl = null;
    if (req.file) {
      const uploaded = await uploadFileToS3(req.file); // sekarang kembalikan {key, publicUrl}
      s3Key = uploaded.key;
      fileUrl = uploaded.publicUrl;
    }

    const newEntry = await Progress.create({
      taskType: oldProgress.taskType,
      taskId: oldProgress.taskId,
      userId: oldProgress.userId,
      dosenName: currentDosenName,
      createdBy: dosenId,
      assignedTo: oldProgress.userId,
      progress: finalProgress,
      status: finalStatus,
      dosenComment: newComment,
      grade: newGrade,
      document: fileUrl,
      s3Key:s3Key,
    });

    console.log("📨 Mengirim status update (by dosen):", {
      taskId: newEntry.taskId,
      status: newEntry.status,
      taskType: newEntry.taskType,
    });

    // Kirim notifikasi ke RabbitMQ
    await publishStatusUpdate(newEntry);

    // 📢 Notifikasi ke mahasiswa yang menerima komentar
    await publishMessage("progress.reviewed", {
      service: "progress-service",
      type: "progress.reviewed",
      message: `Dosen ${currentDosenName} memberi komentar pada tugas Anda (Status: ${finalStatus})${
        newComment ? `: "${newComment}"` : ""
      }`,
      userId: newEntry.userId,
    });

    // 📢 Notifikasi ke dosen yang memberi komentar (konfirmasi)
    await publishMessage("progress.reviewed", {
      service: "progress-service",
      type: "progress.reviewed",
      message: `Komentar Anda untuk tugas #${newEntry.taskId} telah berhasil dikirim ke mahasiswa.`,
      userId: dosenId,
    });

    res.status(200).json({
      success: true,
      message: `Progress berhasil disimpan sebagai '${finalStatus}'`,
      data: { ...newEntry.toJSON(), fileUrl },
    });
  } catch (error) {
    console.error("❌ Gagal menambahkan komentar dosen:", error.message);
    res.status(500).json({
      success: false,
      message: "Gagal menambahkan komentar dosen",
      error: error.message,
    });
  }
};

const getByTaskIndividualId = async (req, res) => {
  const { taskId } = req.params;
  const { id: userId, role } = req.user;

  try {
    let where = { taskId, taskType: "Individual" };

    // Cek apakah ada data progress untuk taskId ini
    const progressExists = await Progress.findOne({ where });
    if (!progressExists) {
      return res.status(404).json({ message: "Tugas tidak ditemukan" });
    }

    if (role === "Mahasiswa") {
      // Cek apakah dia assignedTo
      const isAssigned = await Progress.findOne({
        where: { taskId, assignedTo: userId },
      });

      if (!isAssigned) {
        return res
          .status(403)
          .json({ message: "Kamu bukan pemilik tugas ini" });
      }
    }

    if (role === "Dosen") {
      const isCreator = await Progress.findOne({
        where: { taskId, createdBy: userId },
      });

      if (!isCreator) {
        return res
          .status(403)
          .json({ message: "Kamu bukan pembuat tugas ini" });
      }
    }

    const progressList = await Progress.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    res.json(progressList);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal mengambil progress", error: error.message });
  }
};

const getByTaskGroupId = async (req, res) => {
  const { taskId } = req.params;
  const { id: userId, role } = req.user;

  try {
    let where = { taskId, taskType: "Group" };

    // Cek apakah ada data progress untuk taskId ini
    const progressExists = await Progress.findOne({ where });
    if (!progressExists) {
      return res.status(404).json({ message: "Tugas tidak ditemukan" });
    }

    if (role === "Mahasiswa") {
      // Cek apakah dia assignedTo
      const isAssigned = await Progress.findOne({
        where: { taskId, assignedTo: userId },
      });

      if (!isAssigned) {
        return res
          .status(403)
          .json({ message: "Kamu bukan pemilik tugas ini" });
      }
    }

    if (role === "Dosen") {
      const isCreator = await Progress.findOne({
        where: { taskId, createdBy: userId },
      });

      if (!isCreator) {
        return res
          .status(403)
          .json({ message: "Kamu bukan pembuat tugas ini" });
      }
    }

    const progressList = await Progress.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    res.json(progressList);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal mengambil progress", error: error.message });
  }
};

const deleteByTaskIndividualId = async (req, res) => {
  const { taskId } = req.params;
  const { id: userId, role } = req.user;

  try {
    // Cek apakah progress Individual dengan taskId ini ada
    const progressList = await Progress.findAll({
      where: { taskId, taskType: "Individual" },
      attributes: ['id', 's3Key']
    });

    if (progressList.length === 0) {
      return res.status(404).json({ message: "Progress tidak ditemukan" });
    }

    // Validasi akses
    if (role === "Mahasiswa") {
      const isAssigned = await Progress.findOne({
        where: { taskId, assignedTo: userId, taskType: "Individual" },
      });

      if (!isAssigned) {
        return res
          .status(403)
          .json({ message: "Kamu tidak memiliki akses untuk menghapus" });
      }
    }

    if (role === "Dosen") {
      const isCreator = await Progress.findOne({
        where: { taskId, createdBy: userId, taskType: "Individual" },
      });

      if (!isCreator) {
        return res
          .status(403)
          .json({ message: "Kamu bukan pembuat progress ini" });
      }
    }

    // 🔥 Hapus file dari S3
    for (const progress of progressList) {
      if (progress.s3Key) {
        console.log(`🗑 Menghapus file S3: ${progress.s3Key}`);
        await deleteFileFromS3(progress.s3Key);
      }
    }

    // Hapus progress
    await Progress.destroy({
      where: { taskId, taskType: "Individual" },
    });

    res.json({ message: "Progress berhasil dihapus" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal menghapus progress", error: error.message });
  }
};

const deleteByTaskGroupId = async (req, res) => {
  const { taskId } = req.params;
  const { id: userId, role } = req.user;

  try {
    let where = { taskId, taskType: "Group" };

    const progressList = await Progress.findAll({ where });

    if (progressList.length === 0) {
      return res.status(404).json({ message: "Progress tidak ditemukan" });
    }

    if (role === "Mahasiswa") {
      const isAssigned = await Progress.findOne({
        where: { taskId, assignedTo: userId },
      });

      if (!isAssigned) {
        return res
          .status(403)
          .json({ message: "Kamu bukan pemilik tugas ini" });
      }

      // Biar mahasiswa hanya hapus progress dia sendiri
      where.assignedTo = userId;
    }

    if (role === "Dosen") {
      const isCreator = await Progress.findOne({
        where: { taskId, createdBy: userId },
      });

      if (!isCreator) {
        return res
          .status(403)
          .json({ message: "Kamu bukan pembuat tugas ini" });
      }

      // Biar dosen hanya hapus progress yang dia buat
      where.createdBy = userId;
    }

    for (const progress of progressList) {
  if (progress.s3Key) {
    console.log(`🗑 Menghapus file S3: ${progress.s3Key}`);
    await deleteFileFromS3(progress.s3Key);
  }
}

    const deletedCount = await Progress.destroy({ where });

    if (deletedCount === 0) {
      return res.status(404).json({ message: "Progress tidak ditemukan" });
    }

    res.json({ message: "Progress berhasil dihapus", deleted: deletedCount });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal menghapus progress", error: error.message });
  }
};

const getStatistikByUser = async (req, res) => {
  const userId = req.params.userId;
  const all = await Progress.findAll({ where: { userId } });
  const done = all.filter((p) => p.status === "done").length;
  const avg =
    all.reduce((acc, curr) => acc + curr.progress, 0) / (all.length || 1);
  res.json({ total: all.length, done, avg });
};

// GET /progress/user/:userId
const getByUserId = async (req, res) => {
  try {
    const data = await Progress.findAll({
      where: { userId: req.params.userId },
      attributes: [
        "id",
        "taskId",
        "taskType",
        "progress",
        "status",
        "message",
        "comment",
        "createdAt",
        "groupId", // tambahkan
        "createdBy",
        "createdByRole",
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(data);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal mengambil data progress", error: error.message });
  }
};

module.exports = {
  updateProgress,
  addCommentByDosen,
  getByTaskIndividualId,
  getByTaskGroupId,
  getStatistikByUser,
  getByUserId,
  deleteByTaskIndividualId,
  deleteByTaskGroupId,
};

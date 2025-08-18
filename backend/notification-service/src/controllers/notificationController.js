const Notification = require("../models/Notification");

exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data notifikasi" });
  }
};

exports.getNotificationsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });
    res.json(notifications);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Gagal mengambil data notifikasi berdasarkan user" });
  }
};

exports.deleteNotificationByUser = async (req, res) => {
  const { id, userId } = req.params;

  try {
    const notification = await Notification.findOne({ where: { id, userId } });

    if (!notification) {
      return res.status(403).json({ error: "Tidak diizinkan menghapus notifikasi ini" });
    }

    await notification.destroy();

    res.json({ message: "Notifikasi berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus notifikasi" });
  }
};

exports.getLatestNotificationByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const latestNotification = await Notification.findOne({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    if (!latestNotification) {
      return res.status(404).json({ error: "Tidak ada notifikasi untuk user ini" });
    }

    res.json(latestNotification);
  } catch (error) {
    console.error("❌ Error getLatestNotificationByUser:", error);
    res.status(500).json({ error: "Gagal mengambil notifikasi terbaru" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    // optional: verifikasi user => req.user.id harus sama dengan notification.userId
    const notif = await Notification.findByPk(id);
    if (!notif) return res.status(404).json({ error: "Notifikasi tidak ditemukan" });

    notif.isRead = true;
    await notif.save();

    res.json({ message: "Notifikasi ditandai sudah dibaca" });
  } catch (err) {
    console.error("Error markAsRead:", err);
    res.status(500).json({ error: "Gagal update notifikasi" });
  }
};



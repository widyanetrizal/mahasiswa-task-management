const Log = require("../models/Log");

exports.getAllLogging = async (req, res) => {
  const { role } = req.user;
  try {
    if (role !== "Admin") {
      return res
        .status(403)
        .json({ error: "Hanya admin yang diperbolehkan" });
    }

    const Logging = await Log.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(Logging);
  } catch (error) {
    console.error("createTask:", error.message);
    res.status(500).json({ error: "Gagal mengambil data Logging" });
  }
};

exports.deleteLogging = async (req, res) => {
  const { role } = req.user;
  try {
    const { id } = req.params;

    if (role !== "Admin") {
      return res
        .status(403)
        .json({ error: "Hanya admin yang diperbolehkan" });
    }

    const Logging = await Log.findByPk(id);

    if (!Logging) {
      return res.status(404).json({ error: "Log tidak ditemukan" });
    }
    await Logging.destroy();

    res.json({ message: "Logging berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus Logging" });
  }
};


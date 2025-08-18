const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
require("dotenv").config();
const { Op, Sequelize } = require("sequelize");
const { publishMessage } = require("../utils/rabbitmqPublisher");

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash, role });

    res.status(201).json({
      message: "User berhasil dibuat",
      user
    });
    console.log("profile register");
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Password salah" });

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      message: "User berhasil login",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
    console.log("user login");
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });
    res.json(user);
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

const getUsers = async (req, res) => {
  const { id, role} = req.user;
  const token = req.headers.authorization?.split(" ")[1];

  try {
    if (role !== "Admin") {
      return res
        .status(403)
        .json({ error: "Hanya Admin yang diperbolehkan" });
    }

    const users = await User.findAll({
      attributes: ["id", "name", "email", "role"],
      order: [["createdAt", "DESC"]],
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserById = async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

const getUserCountByRole = async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Hanya Admin yang diperbolehkan" });
    }

    // Query count group by role
    const counts = await User.findAll({
      attributes: [
        "role",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
      ],
      group: ["role"],
      raw: true,
    });

    // Format hasil jadi object { role: count }
    const result = {};
    counts.forEach((item) => {
      result[item.role] = parseInt(item.count, 10);
    });

    res.json({
      success: true,
      counts: result,
    });
  } catch (error) {
    console.error("GET USER COUNT BY ROLE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { password } = req.body;

    // Cek apakah ada password baru
    if (!password) {
      return res.status(400).json({ error: "Password wajib diisi untuk update" });
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update hanya password berdasarkan ID user login
    await User.update(
      { password: hashedPassword },
      { where: { id: req.user.id } }
    );

    // Kirim notifikasi
    await publishMessage("user.update", {
      service: "user-service",
      type: "user.update",
      message: `Anda ${req.user.name} berhasil update password.`,
      userId: req.user.id,
    });

    res.json({
      message: "Password berhasil diperbarui",
      userId: req.user.id,
    });

    console.log(`🔒 Password user ${req.user.id} berhasil diubah`);
  } catch (error) {
    console.error("UPDATE PASSWORD ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};


const deleteAccount = async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Only admin can delete users" });
    }

    const { id } = req.params;

    // Cek apakah user target ada
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // Jangan sampai admin menghapus dirinya sendiri tanpa sengaja
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: "Tidak bisa menghapus akun sendiri" });
    }

    await User.destroy({ where: { id } });

    // Kirim notifikasi
    await publishMessage("user.update", {
      service: "user-service",
      type: "user.delete",
      message: `User ${req.user.name} berhasil dihapus`,
      userId: req.user.id,
    });

    res.json({ message: `User dengan ID ${id} berhasil dihapus` });
    console.log(`User dengan ID ${id} dihapus oleh admin ID ${req.user.id}`);
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus user", error: error.message });
  }
};

const getUserByEmail = async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  getUsers,
  getUserById,
  getUserCountByRole,
  updateProfile,
  deleteAccount,
  getUserByEmail
};
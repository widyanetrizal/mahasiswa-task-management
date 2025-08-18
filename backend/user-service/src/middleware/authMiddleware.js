const jwt = require("jsonwebtoken");
const User = require("../models/user");
require("dotenv").config();

const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ msg: "Token tidak tersedia" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ambil user dari database
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({ msg: "User tidak ditemukan" });
    }

    // Simpan user.id dan user.role untuk middleware authorizeRoles
    req.user = {
      id: user.id,
      name: user.name,
      role: user.role,
    };

    next();
  } catch (err) {
    res.status(403).json({ msg: "Token tidak valid" });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Cek dulu apakah req.user dan req.user.role tersedia
    if (!req.user || !req.user.role) {
      return res
        .status(401)
        .json({ message: "Unauthorized - User role not found" });
    }

    // Cek apakah role user termasuk yang diizinkan
    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access denied - You don't have permission" });
    }

    // Lolos semua pengecekan
    next();
  };
};

module.exports = {
  authenticateToken, 
  authorizeRoles,
};

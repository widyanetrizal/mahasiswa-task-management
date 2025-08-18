const { sequelize }= require("../config/database");
const Class = require("./class.model");
const ClassMember = require("./classMember.model");

async function initModels() {
  try {
    await sequelize.authenticate();
    console.log("✅ Koneksi ke database berhasil.");

    // Buat tabel-tabel jika belum ada
    await sequelize.sync({ alter: true });
    console.log("✅ Tabel Class dan ClassMember sudah siap.");

  } catch (error) {
    console.error("❌ Error inisialisasi database:", error);
    process.exit(1);
  }
}

module.exports = {
  sequelize,
  Class,
  ClassMember,
  initModels,
};

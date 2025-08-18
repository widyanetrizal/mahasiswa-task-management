const { DataTypes } = require("sequelize");
const { sequelize }= require("../config/database");

const Class = sequelize.define("Class", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  creatorName: {
    type: DataTypes.STRING,
    allowNull: true, // bisa kosong jika mahasiswa membuat tugas sendiri
  },
  mataKuliah: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Class;

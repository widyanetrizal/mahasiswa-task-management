const { DataTypes } = require("sequelize");
const { sequelize }= require("../config/database");

const ClassMember = sequelize.define("ClassMember", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  classId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: true, // bisa kosong jika mahasiswa membuat tugas sendiri
  },
});

module.exports = ClassMember;

const { DataTypes } = require("sequelize");
const { sequelize }= require("../config/database");

const Group = sequelize.define("Group", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
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
  classId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

module.exports = Group;

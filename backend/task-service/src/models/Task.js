const { DataTypes } = require("sequelize");
const { sequelize }= require("../config/database");

const Task = sequelize.define("Task", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  dosenName: {
    type: DataTypes.STRING,
    allowNull: true, // bisa kosong jika mahasiswa membuat tugas sendiri
  },
  mahasiswaName: {
    type: DataTypes.STRING,
    allowNull: true, // hanya diisi kalau dosen yang buat tugas
  },
  classId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  mataKuliah: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  judul: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true,
      isFuture(value) {
        if (new Date(value) <= new Date()) {
          throw new Error("Deadline harus berupa tanggal di masa depan");
        }
      },
    },
  },
  status: {
    type: DataTypes.ENUM(
      "Pending",
      "In-Progress",
      "Done",
      "Revisi",
      "Terlambat"
    ),
    defaultValue: "Pending",
  },

  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  deadlineStatus: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  masterTaskId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "Tasks",
      key: "id",
    },
  },
});

module.exports = Task;

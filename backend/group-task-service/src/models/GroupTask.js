const { DataTypes } = require("sequelize");
const { sequelize }= require("../config/database");

const GroupTask = sequelize.define("GroupTask", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  groupId: {
    type: DataTypes.INTEGER,
  },
  judul: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
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
  deadlineStatus: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = GroupTask;

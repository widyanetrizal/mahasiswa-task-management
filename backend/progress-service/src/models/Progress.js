const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Progress = sequelize.define(
  "Progress",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    taskType: {
      type: DataTypes.ENUM("Individual", "Group"),
      allowNull: false,
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: true, // <- artinya boleh kosong
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    assignedTo: {
      type: DataTypes.STRING,
      allowNull: true,
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
    description: {
      type: DataTypes.TEXT,
      // allowNull: true,
    },
    document: {
      type: DataTypes.STRING,
      // allowNull: true,
    },
    s3Key: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dosenComment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    grade: {
      type: DataTypes.STRING, // bisa "A", "B+", "90", dll
      allowNull: true,
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: true, // pastikan tidak null
    },
    dosenName: {
      type: DataTypes.STRING,
      allowNull: true, // pastikan tidak null
    },
    
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "progress",
    timestamps: true,
  }
);

module.exports = Progress;

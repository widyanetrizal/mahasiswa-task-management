const { DataTypes } = require("sequelize");
const { sequelize }= require("../config/db");

const Log = sequelize.define("Log", {
  channel: DataTypes.STRING,
  service: DataTypes.STRING,
  level: DataTypes.STRING,
  eventType: DataTypes.STRING,
  message: DataTypes.STRING,
  metadata: DataTypes.JSON,
});

module.exports = Log;

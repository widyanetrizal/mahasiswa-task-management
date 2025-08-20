const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
  }
);

async function checkMySQL() {
  try {
    const [rows] = await sequelize.query("SELECT 1");
    return "connected";
  } catch (error) {
    throw new Error("MySQL not connected: " + error.message);
  }
}

module.exports = { sequelize, checkMySQL };

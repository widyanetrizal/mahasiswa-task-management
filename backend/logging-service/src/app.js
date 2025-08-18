// const express = require("express");
// const app = express();
// const { sequelize }= require("./config/db");
// const logRoutes = require("./routes/logRoutes");
// const consumeLogs = require("./consumers/logConsumer");
// const cors = require('cors');
// app.use(cors());

// const { metricsMiddleware, register } = require('./metrics');
// app.use(metricsMiddleware);

// app.get('/metrics', async (req, res) => {
//   res.set('Content-Type', register.contentType);
//   res.end(await register.metrics());
// });

// app.get("/health", (req, res) => {
//   res.json({ status: "OK" });
// });

// app.use(express.json());
// app.use("/logs", logRoutes);

// sequelize.sync({ alter: true }).then(() => {
//   console.log("DB connected");
//   consumeLogs();
// });

// module.exports = app;















const express = require("express");
const cors = require('cors');
const app = express();
const { sequelize }= require("./config/db");
const logRoutes = require("./routes/logRoutes");
const consumeLogs = require("./consumers/logConsumer");

const { metricsMiddleware, register } = require('./metrics');

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use(metricsMiddleware);
app.use("/logs", logRoutes);

sequelize.sync({ alter: true }).then(() => {
  console.log("DB connected");
  consumeLogs();
});

module.exports = app;

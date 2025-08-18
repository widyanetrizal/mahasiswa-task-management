const express = require("express");
const cors = require('cors');
const loggerMiddleware = require("./middleware/logger");
const taskRoutes = require("./routes/taskRoutes");
const { metricsMiddleware, register } = require('./metrics');
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});


app.use(loggerMiddleware);
app.use(metricsMiddleware);


app.use("/tasks", taskRoutes);


module.exports = app;

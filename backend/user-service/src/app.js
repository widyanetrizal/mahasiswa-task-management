const express = require("express");
const cors = require("cors");
const loggerMiddleware = require("./middleware/logger");
const userRoutes = require("./routes/userRoutes");
const { metricsMiddleware, register } = require("./metrics");

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint health tanpa logging/metrics
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

// Endpoint metrics untuk Prometheus
app.get("/metrics", async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Middleware logging & metrics dipasang setelah /health & /metrics
app.use(loggerMiddleware);
app.use(metricsMiddleware);

// Routes utama
app.use("/users", userRoutes);

module.exports = app;

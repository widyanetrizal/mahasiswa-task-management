const express = require("express");
const cors = require('cors');
const loggerMiddleware = require("./middleware/logger");
const routes = require("./routes/progressRoutes");
const app = express();

const { metricsMiddleware, register } = require('./metrics');

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

// app.use(cors({
//   origin: 'http://localhost:3000',
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true,
// }));


app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use(loggerMiddleware);
app.use(metricsMiddleware);

// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/progress", routes);


module.exports = app;
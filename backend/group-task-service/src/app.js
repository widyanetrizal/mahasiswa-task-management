// const express = require("express");
// const app = express();
// const groupRoutes = require("./routes/groupRoutes");
// const loggerMiddleware = require("./middleware/logger");
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

// app.use(loggerMiddleware);
// app.use(express.json());
// app.use("/groups", groupRoutes);

// module.exports = app;






const express = require("express");
const cors = require('cors');
const app = express();
const loggerMiddleware = require("./middleware/logger");
const groupRoutes = require("./routes/groupRoutes");
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

app.use(loggerMiddleware);
app.use(metricsMiddleware);

app.use("/groups", groupRoutes);

module.exports = app;

const { publishLog } = require("../utils/logPublisher");

const loggerMiddleware = async (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;

    const isError = res.statusCode >= 400;

    const log = {
      channel: "REST API",
      service: process.env.SERVICE_NAME || "user-service",
      level: isError ? "error" : "info",
      eventType: null,
      message: `${req.method} ${req.originalUrl} - ${res.statusCode}`,
      metadata: {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        timestamp: new Date().toISOString(),
      },
    };
    console.log('Sending log:', log);
    publishLog(log);
  });
  next();
};

module.exports = loggerMiddleware;

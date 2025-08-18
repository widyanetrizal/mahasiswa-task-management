// // src/metrics.js
// const client = require('prom-client');

// // Kumpulkan metrik default (CPU/memory app)
// client.collectDefaultMetrics();

// const httpRequests = new client.Counter({
//   name: 'http_requests_total',
//   help: 'Total jumlah HTTP request',
//   labelNames: ['method', 'route', 'code'],
// });

// const httpRequestDurationMicroseconds = new client.Histogram({
//   name: 'http_request_duration_seconds',
//   help: 'Durasi request HTTP',
//   labelNames: ['method', 'route', 'code'],
//   buckets: [0.1, 0.5, 1, 2, 5]
// });

// module.exports = {
//   metricsMiddleware: (req, res, next) => {
//     const end = httpRequestDurationMicroseconds.startTimer();

//     res.on('finish', () => {
//       httpRequests.inc({
//         method: req.method,
//         route: req.route?.path || req.path,
//         code: res.statusCode
//       });

//       end({
//         method: req.method,
//         route: req.route?.path || req.path,
//         code: res.statusCode
//       });
//     });

//     next();
//   },
//   register: client.register
// };









// src/metrics.js
const client = require('prom-client');

// Registry terpisah untuk tiap service
const register = new client.Registry();

// Kumpulkan metrik default (CPU, memory, GC, dll)
client.collectDefaultMetrics({ register });

// Counter jumlah request
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total jumlah HTTP request',
  labelNames: ['method', 'route', 'code'],
  registers: [register],
});

// Histogram durasi request
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Durasi request HTTP dalam detik',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.3, 0.5, 1, 2, 5], // granular
  registers: [register],
});

// Middleware metrics
function metricsMiddleware(req, res, next) {
  // Jangan hitung /metrics dan /health
  if (req.path === '/metrics' || req.path === '/health') {
    return next();
  }

  const startTimer = httpRequestDurationSeconds.startTimer();

  res.on('finish', () => {
    const route = req.route?.path
      ? `${req.baseUrl}${req.route.path}`
      : req.baseUrl || req.path;

    httpRequestsTotal.inc({
      method: req.method,
      route: route,
      code: res.statusCode
    });

    startTimer({
      method: req.method,
      route: route,
      code: res.statusCode
    });
  });

  next();
}

module.exports = {
  metricsMiddleware,
  register
};

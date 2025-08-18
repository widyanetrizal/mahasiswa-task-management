require("dotenv").config();
const app = require("./src/app");
const http = require("http");
const { Server } = require("socket.io");
const { sequelize }= require("./src/config/db");
const startConsumer = require("./src/services/consumerService");

const PORT = process.env.PORT || 4004;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:80",
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Socket.IO: join room by userId
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join", (userId) => {
    if (!userId) return;
    socket.join(`user_${userId}`);
    console.log(`Socket ${socket.id} joined room user_${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Start DB & server, lalu consumer dengan io
sequelize.sync({ alter: true }).then(() => {
  console.log("Database synced");

  httpServer.listen(PORT, () => {
    console.log(`Notification service listening on port ${PORT}`);
  });

  // pass io ke consumer sehingga consumer bisa emit
  startConsumer(io).catch((err) => console.error("Consumer error:", err));
});



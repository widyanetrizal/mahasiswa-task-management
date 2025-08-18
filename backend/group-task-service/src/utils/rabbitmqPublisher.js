const amqp = require("amqplib");
require("dotenv").config();
const { publishLog } = require("./logPublisher");

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";
const EXCHANGE_NAME = process.env.EXCHANGE_NAME || "notification_exchange";
const QUEUE_NAME = process.env.QUEUE_NAME || "notification_queue";
const ROUTING_KEY = process.env.ROUTING_KEY || "group.*";

let channel, connection;

// Fungsi helper untuk delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry mechanism
async function retryConnect(fn, retries = 10, delayMs = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      console.error(`🔁 Retry ${i + 1}/${retries} - RabbitMQ belum siap: ${err.message}`);
      await delay(delayMs);
    }
  }
  throw new Error("❌ Gagal koneksi ke RabbitMQ setelah beberapa percobaan.");
}

async function connectRabbitMQ() {
  try {
    return retryConnect(async () => {
      connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createChannel();

      await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
      await channel.assertQueue(QUEUE_NAME, { durable: true });
      await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);

      console.log("✅ RabbitMQ connected to Notification");
    });
  } catch (error) {
    console.error("❌ RabbitMQ connection error to notif:", error);
  }
}

async function publishMessage(routingKey, messageObj) {
  const start = Date.now();
  try {
    if (!channel) {
      await connectRabbitMQ();
    }
    const messageBuffer = Buffer.from(JSON.stringify(messageObj));
    channel.publish(EXCHANGE_NAME, routingKey, messageBuffer);

    const duration = Date.now() - start;

    console.log(`[x] Published to ${routingKey}:`, messageObj);

    // 🟩 Kirim ke log queue juga!
    await publishLog({
      channel: "RabbitMQ",
      service: process.env.SERVICE_NAME || "group-task-service",
      level: "info",
      eventType: "PUBLISH",
      message: `Published message to ${routingKey}`,
      metadata: {
        exchange: EXCHANGE_NAME,
        queue: QUEUE_NAME,
        routingKey,
        payload: messageObj,
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    const duration = Date.now() - start;
    // Jika terjadi error saat publish
    console.error("❌ Failed to publish message:", err);

    await publishLog({
      channel: "RabbitMQ",
      service: process.env.SERVICE_NAME || "group-task-service",
      level: "error",
      eventType: "PUBLISH",
      message: `Failed to publish message to ${routingKey}`,
      metadata: {
        error: err.message,
        routingKey,
        payload: messageObj,
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

async function closeConnection() {
  await channel?.close();
  await connection?.close();
}

module.exports = {
  connectRabbitMQ,
  publishMessage,
  closeConnection,
};

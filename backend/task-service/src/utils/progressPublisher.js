const amqp = require("amqplib");
let channel;
const { publishLog } = require("./logPublisher");

// 🟡 Buat exchange
const EXCHANGE_NAME = "progress.exchange";
const QUEUE_NAME = "progress.task.created.queue"; // nama queue bisa bebas
const ROUTING_KEY = "task.created";

async function connectProgressPublisher() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });

    // 🟢 Buat queue dan bind ke exchange
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);

    console.log("✅ RabbitMQ connected to progress.exchange");
  } catch (error) {
    console.error("❌ RabbitMQ connection progress error:", error);
  }
}

async function publishToProgress(
  taskId,
  userId,
  taskType,
  createdBy,
  assignedTo
) {
  const start = Date.now();
  try {
    if (!channel) await connectProgressPublisher();

    // 🟢 Format pesan
    const message = { taskId, userId, taskType, createdBy, assignedTo };

    // 🟢 Publish ke exchange dengan routing key "progress.task.created"
    channel.publish(
      "progress.exchange",
      "task.created", // Routing key
      Buffer.from(JSON.stringify(message))
    );

    console.log(`[x] Published to progress.exchange:`, message);

    const duration = Date.now() - start;

    // 🟩 Kirim ke log queue juga!
    await publishLog({
      channel: "RabbitMQ",
      service: process.env.SERVICE_NAME || "task-service",
      level: "info",
      eventType: "PUBLISH",
      message: `Published message to ${ROUTING_KEY}`,
      metadata: {
        exchange: EXCHANGE_NAME,
        queue: QUEUE_NAME,
        routingKey: ROUTING_KEY,
        payload: message,
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
      service: process.env.SERVICE_NAME || "task-service",
      level: "error",
      eventType: "PUBLISH",
      message: `Failed to publish message to ${ROUTING_KEY}`,
      metadata: {
        error: err.message,
        routingKey: ROUTING_KEY,
        payload: message,
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

module.exports = { publishToProgress };

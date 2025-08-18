const amqp = require("amqplib");
const { publishLog } = require("./logPublisher"); // ✅ Tambahkan ini
let channel;

const EXCHANGE_NAME = "progress.exchange";
const QUEUE_NAME = "progress.dispatcher.queue"; // Queue ini akan dipakai di log
const ROUTING_KEYS = ["task.updated", "group.task.updated"];

async function connect() {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await conn.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    for (const key of ROUTING_KEYS) {
      await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, key);
    }

    console.log("✅ RabbitMQ connected to progress.exchange");
  } catch (error) {
    console.error("❌ RabbitMQ connection progress error:", error);
  }
}

async function publishStatusUpdate(progress) {
  const start = Date.now();

  if (!channel) await connect();

  const messageObj = {
    taskId: progress.taskId,
    status: progress.status,
    progress: progress.progress,
    userId: progress.userId,
    taskType: progress.taskType,
  };

  const buffer = Buffer.from(JSON.stringify(messageObj));

  let routingKey = "";
  if (progress.taskType === "Individual") {
    routingKey = "task.updated";
  } else if (progress.taskType === "Group") {
    routingKey = "group.task.updated";
  } else {
    console.warn("⚠️ taskType tidak diketahui:", progress.taskType);
    return;
  }

  try {
    channel.publish(EXCHANGE_NAME, routingKey, buffer);

    const duration = Date.now() - start;
    console.log(`📤 Status update dikirim ke routingkey: ${routingKey}`, messageObj);

    // ✅ Kirim ke log queue
    await publishLog({
      channel: "RabbitMQ",
      service: process.env.SERVICE_NAME || "progress-service",
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
    console.error("❌ Failed to publish message:", err.message);

    await publishLog({
      channel: "RabbitMQ",
      service: process.env.SERVICE_NAME || "progress-service",
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

module.exports = { publishStatusUpdate };

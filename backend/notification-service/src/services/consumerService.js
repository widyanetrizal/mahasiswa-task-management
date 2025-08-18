const amqp = require("amqplib");
const Notification = require("../models/Notification");
const { publishLog } = require("../utils/logPublisher"); // ✅ Import log publisher
require("dotenv").config();

const listenToQueue = async (io) => {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await conn.createChannel();

    const EXCHANGE_NAME = process.env.EXCHANGE_NAME;
    const QUEUE_NAME = process.env.QUEUE_NAME;
    const SERVICE_NAME = process.env.SERVICE_NAME || "notification-service";

    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    const routingKeys = [
      "user.update",
      "class.created",
      "class.student.added",
      "class.student.removed",
      "class.updated",
      "class.student.removed",
      "class.deleted",
      "task.created",
      "task.updated",
      "task.deleted",
      "group.created",
      "group.member_added",
      "group.task_created",
      "group.updated",
      "group.task_updated",
      "group.task_deleted",
      "group.deleted",
      "progress.updated",
      "progress.reviewed",
    ];

    for (const key of routingKeys) {
      await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, key);
    }

    console.log(
      `[*] Waiting for messages in queue "${QUEUE_NAME}". To exit press CTRL+C`
    );

    channel.consume(QUEUE_NAME, async (msg) => {
      const start = Date.now(); // ⏱️ Mulai hitung durasi
      let data = null;

      try {
        const content = msg.content.toString();
        data = JSON.parse(content);

        console.log(
          `[x] Received message with routing key ${msg.fields.routingKey}:`,
          data
        );

        // Simpan ke DB, isRead default false
        const created = await Notification.create({
          service: data.service || null,
          type: data.type || msg.fields.routingKey,
          message: data.message || JSON.stringify(data),
          userId: data.userId || null,
          isRead: false,
        });

        // Emit ke frontend user room (jika userId ada)
        if (created.userId) {
          const payload = {
            id: created.id,
            service: created.service,
            type: created.type,
            message: created.message,
            userId: created.userId,
            createdAt: created.createdAt,
            isRead: created.isRead,
          };

          console.log("Emit payload:", payload);
          console.log("Emit room:", `user_${created.userId}`);

          io.to(`user_${created.userId}`).emit("notification", payload);
          console.log(`Emitted notification to user_${created.userId}`);
        }

        const duration = Date.now() - start;
        await publishLog({
          channel: "RabbitMQ",
          service: SERVICE_NAME,
          level: "info",
          eventType: "CONSUME",
          message: `Consumed message from ${msg.fields.routingKey}`,
          metadata: {
            exchange: EXCHANGE_NAME,
            queue: QUEUE_NAME,
            routingKey: msg.fields.routingKey,
            payload: data,
            duration,
            timestamp: new Date().toISOString(),
          },
        });

        channel.ack(msg);
      } catch (err) {
        const duration = Date.now() - start;
        console.error("❌ Error memproses message:", err.message);

        await publishLog({
          channel: "RabbitMQ",
          service: SERVICE_NAME,
          level: "error",
          eventType: "CONSUME",
          message: `Failed to process message from ${
            msg.fields?.routingKey || "unknown"
          }`,
          metadata: {
            error: err.message,
            routingKey: msg.fields?.routingKey,
            payload: data,
            duration,
            timestamp: new Date().toISOString(),
          },
        });

        channel.ack(msg); // atau gunakan .nack(msg, false, false) jika ingin reject
      }
    });
  } catch (error) {
    console.error("❌ RabbitMQ connection error:", error.message);
  }
};

module.exports = listenToQueue;

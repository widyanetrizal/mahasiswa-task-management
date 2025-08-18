// task-service/src/utils/progressStatusConsumer.js
const GroupTask = require("../models/GroupTask");
const amqp = require("amqplib");
const { publishLog } = require("./logPublisher");

const EXCHANGE_NAME = "progress.exchange";
const QUEUE_NAME = "progress.task.group.queue";
const ROUTING_KEY = "group.task.updated";

async function startProgressStatusConsumer() {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await conn.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    // Bind queue ke exchange dengan routing key yang spesifik
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);

    console.log(`✅ Listening on queue: ${QUEUE_NAME}`);

    channel.consume(QUEUE_NAME, async (msg) => {
      const start = Date.now();

      if (msg !== null) {
        const data = JSON.parse(msg.content.toString());
        console.log("📥 Group-Task-Service menerima update progress:", data);

        try {
          // Jika ingin update ke DB task:
          const task = await GroupTask.findByPk(data.taskId);
          if (task) {
            await task.update({ status: data.status });
          }

          // ✅ Kirim log jika berhasil konsumsi dan proses
          const duration = Date.now() - start;
          await publishLog({
            channel: "RabbitMQ",
            service: process.env.SERVICE_NAME || "group-task-service",
            level: "info",
            eventType: "CONSUME",
            message: `Consume message from ${ROUTING_KEY}`,
            metadata: {
              exchange: EXCHANGE_NAME,
              queue: QUEUE_NAME,
              routingKey: ROUTING_KEY,
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
            service: process.env.SERVICE_NAME || "group-task-service",
            level: "error",
            eventType: "CONSUME",
            message: `Failed to process message from ${ROUTING_KEY}`,
            metadata: {
              error: err.message,
              routingKey: ROUTING_KEY,
              payload: data,
              duration,
              timestamp: new Date().toISOString(),
            },
          });

          channel.nack(msg); // ❗ Optional: jangan ack kalau gagal
        }
      }
    });
  } catch (error) {
    console.error("❌ Gagal mengkonsumsi progress update:", error.message);

    await publishLog({
      channel: "RabbitMQ",
      service: process.env.SERVICE_NAME || "group-task-service",
      level: "error",
      eventType: "CONSUME",
      message: `Consumer failed to start`,
      metadata: {
        error: error.message,
        exchange: EXCHANGE_NAME,
        queue: QUEUE_NAME,
        routingKey: ROUTING_KEY,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

module.exports = { startProgressStatusConsumer };

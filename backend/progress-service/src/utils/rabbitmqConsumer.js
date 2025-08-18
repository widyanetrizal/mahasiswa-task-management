const amqp = require("amqplib");
const Progress = require("../models/Progress");
const { publishLog } = require("../utils/logPublisher");

const EXCHANGE_NAME = "progress.exchange";
const QUEUE_NAME = "progress.task.created.queue";
const ROUTING_KEY = ["task.created", "group.task.created"];

(async () => {
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await conn.createChannel();

  await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  for (const key of ROUTING_KEY) {
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, key);
  }

  channel.consume(QUEUE_NAME, async (msg) => {
    const start = Date.now();

    try {
      const content = msg.content.toString();
      const data = JSON.parse(content);

      const {
        taskId,
        userId,
        userName,
        dosenName,
        taskType,
        createdBy,
        assignedTo,
        groupId,
      } = data;

      console.log("📥 Data diterima dari progress.exchange:", data);

      if (!userId || !taskId || !taskType) {
        console.error("❌ Data dari queue tidak lengkap. Lewati.");
        channel.ack(msg);
        return;
      }

      await Progress.create({
        taskId,
        userId,
        userName,
        dosenName,
        taskType,
        createdBy,
        assignedTo,
        groupId: taskType === "Group" ? groupId : null,
        progress: 0,
        status: "Pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      channel.ack(msg);

      console.log("📌 Data disimpan ke DB:", {
        taskId,
        userId,
        userName,
        dosenName,
        taskType,
        createdBy,
        assignedTo,
        groupId,
      });

      await publishLog({
        channel: "RabbitMQ",
        service: process.env.SERVICE_NAME || "progress-service",
        level: "info",
        eventType: "CONSUME",
        message: "consume dan penyimpanan data berhasil",
        metadata: {
          exchange: EXCHANGE_NAME,
          queue: QUEUE_NAME,
          routingKey: msg.fields.routingKey,
          payload: data,
          duration: Date.now() - start,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error("❌ Gagal proses pesan:", err.message);

      await publishLog({
        channel: "RabbitMQ",
        service: process.env.SERVICE_NAME || "progress-service",
        level: "error",
        eventType: "CONSUME",
        message: "Gagal konsumsi data",
        metadata: {
          exchange: EXCHANGE_NAME,
          queue: QUEUE_NAME,
          error: err.message,
          rawContent: msg.content.toString(),
          duration: Date.now() - start,
          timestamp: new Date().toISOString(),
        },
      });

      // ⚠️ ACK tetap agar tidak repeat (atau bisa pakai DLQ jika perlu)
      channel.ack(msg);
    }
  });

  console.log("✅ Progress consumer listening on routing key:", ROUTING_KEY);
})();

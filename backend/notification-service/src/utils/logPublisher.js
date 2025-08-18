const amqp = require("amqplib");
require("dotenv").config();

let channel;

// Fungsi delay (untuk jeda antar retry)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fungsi retry wrapper untuk koneksi
async function retryConnect(fn, retries = 10, delayMs = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      console.error(`Retry ${i+1}/${retries} - Error connecting to RabbitMQ Log:`, err.message);
      await delay(delayMs);
    }
  }
  throw new Error("❌ Gagal koneksi ke RabbitMQ Log setelah beberapa kali mencoba.");
}

const connectLogRabbitMQ = async () => {
  const  connection = await retryConnect(() => amqp.connect(process.env.RABBITMQ_URL), 10, 5000);
  channel = await connection.createChannel();
  await channel.assertQueue(process.env.LOG_QUEUE || 'logs_queue');
};

const publishLog = async (log) => {
  if(!channel) {
    console.error("Chanel belum tersedia!");
    return;
  }
  channel.sendToQueue(
    process.env.LOG_QUEUE || "logs_queue",
    Buffer.from(JSON.stringify(log))
  );
}

module.exports = {
  connectLogRabbitMQ,
  publishLog,
};
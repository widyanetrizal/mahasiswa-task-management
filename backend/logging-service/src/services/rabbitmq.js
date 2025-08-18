const amqp = require("amqplib");

async function checkRabbitMQ() {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL);
    await conn.close();
    return "connected";
  } catch (error) {
    throw new Error("RabbitMQ notconnected: " + error.message);
  }
}

module.exports = { checkRabbitMQ };

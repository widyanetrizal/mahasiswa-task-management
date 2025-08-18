const amqp = require("amqplib");
const Log = require("../models/Log");
require("dotenv").config();

const consumeLogs = async () => {
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await conn.createChannel();
  await channel.assertQueue(process.env.LOG_QUEUE);

  channel.consume(process.env.LOG_QUEUE, async (msg) => {
    if (msg !== null) {
      const content = JSON.parse(msg.content.toString());
      await Log.create(content);
      channel.ack(msg);
    }
  });
};

module.exports = consumeLogs;

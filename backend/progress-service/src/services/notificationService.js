const amqp = require("amqplib");
let channel;
(async () => {
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await conn.createChannel();
  await channel.assertExchange(process.env.EXCHANGE_NAME, "topic", { durable: true });
})();

exports.sendNotification = async (userId, message) => {
  const payload = {
    service: "progress-service",
    type: "progress.done",
    userId,
    message,
  };
  channel.publish(process.env.EXCHANGE_NAME, "progress.done", Buffer.from(JSON.stringify(payload)));
};

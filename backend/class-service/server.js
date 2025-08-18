const app = require("./src/app");
require("dotenv").config();

const PORT = process.env.PORT || 4006;

const { sequelize }= require("./src/config/database");
const { connectLogRabbitMQ } = require("./src/utils/logPublisher");
// const { connectRabbitMQ } = require("./src/utils/rabbitmqPublisher");
// const { startProgressStatusConsumer } = require("./src/utils/progressStatusConsumer");

// Fungsi penundaan
const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const startServer = async () => {
  try {
    console.log("⏳ Menunggu service lain siap...");
    await new Promise(resolve => setTimeout(resolve, 5000)); // delay 5 detik

    // Retry koneksi database
    let retries = 10;
    while (retries) {
      try {
        await sequelize.authenticate();
        await sequelize.sync();
        // { alter: true }
        console.log("✅ Database terhubung");
        break;
      } catch (err) {
        retries--;
        console.log(`🔁 Database belum siap, coba lagi (${10 - retries}/10)...`);
        await waitFor(5000);
        if (retries === 0) throw new Error("❌ Gagal koneksi ke MySQL setelah 10x percobaan");
      }
    }

    const connectWithRetry = async (connectFn, name) => {
          let retries = 10;
          while (retries) {
            try {
              await connectFn();
              console.log(`✅ ${name} terhubung`);
              return;
            } catch (err) {
              retries--;
              console.log(
                `🔁 ${name} belum siap, coba lagi (${10 - retries}/10)...`
              );
              await waitFor(5000);
              if (retries === 0) throw new Error(`❌ Gagal koneksi ke ${name}`);
            }
          }
        };
        // Koneksi RabbitMQ utama
        // await connectWithRetry(connectRabbitMQ, "RabbitMQ untuk notification");
        // console.log("✅ RabbitMQ untuk notification terhubung");
    
        // Koneksi RabbitMQ untuk logging
        await connectWithRetry(connectLogRabbitMQ, "RabbitMQ untuk logging");
        // console.log("✅ RabbitMQ untuk logging terhubung");

    // // Koneksi RabbitMQ untuk logging
    // await connectLogRabbitMQ();
    // console.log("✅ RabbitMQ untuk logging terhubung");

    // Jalankan server
    app.listen(PORT, () => {
      console.log(`🚀 Class Service running on port ${PORT}`);
    });

  } catch (err) {
    console.error("❌ Gagal koneksi:", err.message);
    process.exit(1);
  }
};

startServer();
// startProgressStatusConsumer();

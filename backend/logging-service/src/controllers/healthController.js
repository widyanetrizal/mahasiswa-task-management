const { checkMySQL } = require("../config/db");
const { checkRabbitMQ } = require("../services/rabbitmq");

const getHealthStatus = async(req, res) => {
    try {
        const dbStatus = await checkMySQL();
        const mqStatus = await checkRabbitMQ();
    
        res.status(200).json({
            status: "OK",
            service: "logging-service",
            db: dbStatus,
            rabbitmq: mqStatus,
            time: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: "FAIL",
            error: error.message
        });
    }
}

module.exports = { getHealthStatus };
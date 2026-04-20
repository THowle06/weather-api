const { createClient } = require("redis");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const client = createClient({ url: REDIS_URL });

let connected = false;

client.on("error", (error) => {
    console.error("Redis error:", error.message);
});

async function connectRedis() {
    if (connected) return;

    await client.connect();
    connected = true;
    console.log("Redis connected");
}

function isRedisReady() {
    return connected && client.isOpen;
}

function getRedisClient() {
    return client;
}

module.exports = {
    connectRedis,
    getRedisClient,
    isRedisReady,
};
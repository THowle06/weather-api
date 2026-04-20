require("dotenv").config();
const app = require("./app");
const { connectRedis } = require("./services/cache.service");

const port = process.env.PORT || 3000;

async function startServer() {
    try {
        await connectRedis();
    } catch (error) {
        console.error("Redis unavailable. Continuing without cache:", error.message);
    }

    app.listen(port, () => {
        console.log(`Weather API Server listening on http://localhost:${port}`);
    });
}

startServer();
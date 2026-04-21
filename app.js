require("dotenv").config();
const express = require("express");

const indexRouter = require("./routes/index.routes");
const healthRouter = require("./routes/health.routes");
const weatherRouter = require("./routes/weather.routes");
const { StatusCodes } = require("http-status-codes");
const { requestLogger } = require("./middleware/request-logger");
const { createRateLimiter } = require("./middleware/rate-limit");

const app = express();

const trustProxyRaw = process.env.TRUST_PROXY;
if (trustProxyRaw === undefined) {
    app.set("trust proxy", 1);
} else if (trustProxyRaw === "true") {
    app.set("trust proxy", true);
} else if (trustProxyRaw === "false") {
    app.set("trust proxy", false);
} else {
    const trustProxyNumber = Number(trustProxyRaw);
    app.set("trust proxy", Number.isInteger(trustProxyNumber) ? trustProxyNumber : 1);
}

const weatherRateLimiter = createRateLimiter({
    windowSeconds: Number(process.env.RATE_LIMIT_WINDOW_SECONDS || 60),
    maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 60),
    keyPrefix: process.env.RATE_LIMIT_PREFIX || "rate_limit:weather",
});

app.use(express.json());
app.use(requestLogger);

app.use("/", indexRouter);
app.use("/health", healthRouter);
app.use("/weather", weatherRateLimiter, weatherRouter);

app.use((req, res) => {
    res.status(StatusCodes.NOT_FOUND).json({ message: "Route not found" });
})

module.exports = app;
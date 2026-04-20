require("dotenv").config();
const express = require("express");

const indexRouter = require("./routes/index.routes");
const healthRouter = require("./routes/health.routes");
const weatherRouter = require("./routes/weather.routes");
const { StatusCodes } = require("http-status-codes");
const { requestLogger } = require("./middleware/request-logger");

const app = express();

app.use(express.json());
app.use(requestLogger);
app.use("/", indexRouter);
app.use("/health", healthRouter);
app.use("/weather", weatherRouter);

app.use((req, res) => {
    res.status(StatusCodes.NOT_FOUND).json({ message: "Route not found" });
})

module.exports = app;
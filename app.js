require("dotenv").config();
const express = require("express");

const indexRouter = require("./routes/index.routes");
const healthRouter = require("./routes/health.routes");
const { StatusCodes } = require("http-status-codes");

const app = express();

app.use(express.json());
app.use("/", indexRouter);
app.use("/health", healthRouter);

app.use((req, res) => {
    res.status(StatusCodes.NOT_FOUND).json({ message: "Route not found" });
})

module.exports = app;
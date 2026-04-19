const { StatusCodes } = require("http-status-codes");
const express = require("express");

const router = express.Router();

router.use(express.json())

router.get("/", (req, res) => {
    res.status(StatusCodes.OK).json({ "message": "Welcome to Weather API!" });
});

module.exports = router;
const express = require('express');
const { StatusCodes } = require('http-status-codes');

const app = express();
const port = 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.status(StatusCodes.OK).json({ "message": "Welcome to the Weather API!" });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
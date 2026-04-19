const express = require("express");
const {
    getAppHealth,
    getExternalWeatherApiHealth,
    getHealthSummary,
} = require("../services/health.service");

const router = express.Router();

router.get("/", async (req, res) => {
    const health = await getHealthSummary();
    res.json(health);
});

router.get("/app", (req, res) => {
    res.json(getAppHealth());
});

router.get("/external", async (req, res) => {
    const externalHealth = await getExternalWeatherApiHealth();
    res.json(externalHealth);
});

module.exports = router;
const { StatusCodes } = require("http-status-codes");
const { getWeatherByCity } = require("../services/weather.service");

async function getWeather(req, res) {
    const city = req.params.city?.trim();

    if (!city) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: "City is required",
        });
    }

    try {
        const weather = await getWeatherByCity(city);

        return res.status(StatusCodes.OK).json({
            status: "success",
            data: weather,
        });
    } catch (error) {
        const statusCode = Number.isInteger(error.statusCode)
            ? error.statusCode
            : StatusCodes.INTERNAL_SERVER_ERROR;

        return res.status(statusCode).json({
            status: "error",
            message: error.message || "Failed to fetch weather data",
            details: error.details || null,
        });
    }
}

module.exports = {
    getWeather,
};
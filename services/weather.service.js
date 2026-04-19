const https = require("https");
const http = require("http");

const WEATHER_API_BASE_URL = process.env.API_URL;
const WEATHER_API_KEY = process.env.API_KEY;
const DEFAULT_TIMEOUT_MS = 5000;

function buildWeatherUrl(city) {
    if (!WEATHER_API_BASE_URL || !WEATHER_API_KEY) {
        const error = new Error("API_URL and API_KEY must be configured");
        error.statusCode = 500;
        throw error;
    }

    const url = new URL(
        `${WEATHER_API_BASE_URL.replace(/\/+$/, "")}/${encodeURIComponent(city)}`
    );

    url.searchParams.set("key", WEATHER_API_KEY);
    url.searchParams.set("unitGroup", "metric");
    url.searchParams.set("contentType", "json");

    return url.toString();
}

function requestJson(url, timeoutMs = DEFAULT_TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const client = parsedUrl.protocol === "http:" ? http : https;

        const req = client.request(
            parsedUrl,
            { method: "GET", timeout: timeoutMs },
            (res) => {
                let body = "";

                res.on("data", (chunk) => {
                    body += chunk;
                });

                res.on("end", () => {
                    let parsedBody = {};
                    if (body) {
                        try {
                            parsedBody = JSON.parse(body);
                        } catch {
                            const error = new Error("Invalid JSON returned from weather provider");
                            error.statusCode = 502;
                            return reject(error);
                        }
                    }

                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        return resolve(parsedBody);
                    }

                    const error = new Error("Weather provider request failed");
                    error.statusCode = res.statusCode === 404 ? 404 : 502;
                    error.details = parsedBody;
                    return reject(error);
                });
            }
        );

        req.on("timeout", () => {
            req.destroy(new Error("Weather provider request timed out"));
        });

        req.on("error", (err) => {
            const error = new Error(err.message || "Failed to call weather provoder");
            error.statusCode = 502;
            reject(error);
        });

        req.end();
    });
}

function mapWeatherResponse(city, upstreamData) {
    const today = Array.isArray(upstreamData.days) ? upstreamData.days[0] || {} : {};
    const current = upstreamData.currentConditions || today || {};

    return {
        city,
        resolvedAddress: upstreamData.resolvedAddress || city,
        timezone: upstreamData.timezone || null,
        description: upstreamData.description || null,
        current: {
            temperature: current.temp ?? null,
            feelsLike: current.feelslike ?? null,
            humidity: current.humidity ?? null,
            windSpeed: current.windspeed ?? null,
            conditions: current.conditions || null,
            icon: current.icon || null
        },
        today: {
            tempMax: today.tempmax ?? null,
            tempMin: today.tempmin ?? null,
            precipProb: today.precipprob ?? null,
            sunrise: today.sunrise || null,
            sunset: today.sunset || null
        },
        source: "visual-crossing",
        fetchedAt: new Date().toISOString()
    };
}

async function getWeatherByCity(city) {
    if (!city || !city.trim()) {
        const error = new Error("City is required");
        error.statusCode = 400;
        throw error;
    }

    const normalisedCity = city.trim();
    const url = buildWeatherUrl(normalisedCity);
    const upstreamData = await requestJson(url);

    return mapWeatherResponse(normalisedCity, upstreamData);
}

module.exports = {
    getWeatherByCity
};
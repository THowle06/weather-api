const https = require("https");
const http = require("http");
const { getRedisClient, isRedisReady } = require("./cache.service");

const DEFAULT_TIMEOUT_MS = 3000;
const WEATHER_API_BASE_URL = process.env.API_URL;
const WEATHER_API_KEY = process.env.API_KEY;

function getTimestamp() {
    return new Date().toISOString();
}

function getAppHealth() {
    return {
        service: "app",
        status: "ok",
        timestamp: getTimestamp(),
    };
}

function buildWeatherUrl(city = "London") {
    if (!WEATHER_API_BASE_URL) {
        return null;
    }

    const url = new URL(WEATHER_API_BASE_URL.replace(/\/+$/, ""));
    url.pathname = `${url.pathname.replace(/\/+$/, "")}/${encodeURIComponent(city)}`;

    if (WEATHER_API_KEY) {
        url.searchParams.set("key", WEATHER_API_KEY);
    }

    return url.toString();
}

function requestWithTimeout(url, timeoutMs = DEFAULT_TIMEOUT_MS) {
    return new Promise((resolve) => {
        const parsedUrl = new URL(url);
        const client = parsedUrl.protocol === "http:" ? http : https;
        const startedAt = Date.now();

        const req = client.request(
            parsedUrl,
            {
                method: "GET",
                timeout: timeoutMs,
            },
            (res) => {
                const elapsedMs = Date.now() - startedAt;

                res.resume();

                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    statusCode: res.statusCode,
                    elapsedMs,
                });
            }
        );

        req.on("timeout", () => {
            req.destroy(new Error("Request timed out"));
        });

        req.on("error", (error) => {
            const elapsedMs = Date.now() - startedAt;

            resolve({
                ok: false,
                error: error.message,
                elapsedMs,
            });
        });

        req.end();
    });
}

async function getExternalWeatherApiHealth() {
    const url = buildWeatherUrl("London");

    if (!url) {
        return {
            service: "external-weather-api",
            status: "down",
            timestamp: getTimestamp(),
            error: "API_URL is not configured",
        };
    }

    const result = await requestWithTimeout(url);

    if (result.ok) {
        return {
            service: "external-weather-api",
            status: "ok",
            timestamp: getTimestamp(),
            url,
            statusCode: result.statusCode,
            elapsedMs: result.elapsedMs,
        };
    }

    return {
        service: "external-weather-api",
        status: "down",
        timestamp: getTimestamp(),
        url,
        statusCode: result.statusCode,
        elapsedMs: result.elapsedMs,
        error: result.error || "Upstream responded with a non-2xx status",
    };
}

async function getCacheHealth() {
    const startedAt = Date.now();

    if (!isRedisReady()) {
        return {
            service: "redis-cache",
            status: "down",
            timestamp: getTimestamp(),
            error: "Redis client is not connected",
        };
    }

    try {
        const redis = getRedisClient();
        const pingResponse = await redis.ping();
        const elapsedMs = Date.now() - startedAt;

        return {
            service: "redis-cache",
            status: pingResponse === "PONG" ? "ok" : "down",
            timestamp: getTimestamp(),
            elapsedMs,
            response: pingResponse,
        };
    } catch (error) {
        const elapsedMs = Date.now() - startedAt;

        return {
            service: "redis-cache",
            status: "down",
            timestamp: getTimestamp(),
            elapsedMs,
            error: error.message || "Redis ping failed",
        };
    }
}

async function getHealthSummary() {
    const [app, external, cache] = await Promise.all([
        Promise.resolve(getAppHealth()),
        getExternalWeatherApiHealth(),
        getCacheHealth(),
    ]);

    return {
        app,
        external,
        cache,
        timestamp: getTimestamp(),
    };
}

module.exports = {
    getAppHealth,
    getExternalWeatherApiHealth,
    getCacheHealth,
    getHealthSummary,
};
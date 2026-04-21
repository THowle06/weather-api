const { StatusCodes } = require("http-status-codes");
const { getRedisClient, isRedisReady } = require("../services/cache.service");

function getClientIp(req) {
    const forwardedFor = req.headers["x-forward-for"];

    if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
        return forwardedFor.split(",")[0].trim();
    }

    return req.ip || (req.socket && req.socket.remoteAddress) || "unknown";
}

function createRateLimiter(options = {}) {
    const windowSeconds = Number(options.windowSeconds || 60);
    const maxRequests = Number(options.maxRequests || 60);
    const keyPrefix = String(options.keyPrefix || "rate_limit:weather");

    return async (req, res, next) => {
        if (!isRedisReady()) {
            return next();
        }

        try {
            const redis = getRedisClient();
            const clientIp = getClientIp(req);
            const key = `${keyPrefix}:${clientIp}`;

            const count = await redis.incr(key);

            if (count === 1) {
                await redis.expire(key, windowSeconds);
            }

            let ttlSeconds = await redis.ttl(key);
            if (!Number.isInteger(ttlSeconds) || ttlSeconds < 0) {
                ttlSeconds = windowSeconds;
            }

            const remaining = Math.max(maxRequests - count, 0);
            const resetAt = Math.floor(Date.now() / 1000) + ttlSeconds;

            res.setHeader("X-RateLimit-Limit", String(maxRequests));
            res.setHeader("X-RateLimit-Remaining", String(remaining));
            res.setHeader("X-RateLimit-Reset", String(resetAt));

            if (count > maxRequests) {
                res.setHeader("Retry-After", String(Math.max(ttlSeconds, 1)));
                return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
                    status: "error",
                    message: "Too many requests. Please try again later.",
                });
            }

            return next();
        } catch (error) {
            console.error("Rate limiter failed:", error.message);
            return next();
        }
    };
}

module.exports = {
    createRateLimiter,
};
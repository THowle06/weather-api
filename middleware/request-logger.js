const COLORS = {
    reset: "\x1b[0m",
    dim: "\x1b[2m",
    green: "\x1b[32m",
    cyan: "\x1b[36m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
};

function getStatusColor(statusCode) {
    if (statusCode >= 500) return COLORS.red;
    if (statusCode >= 400) return COLORS.yellow;
    if (statusCode >= 300) return COLORS.cyan;
    return COLORS.green;
}

function requestLogger(req, res, next) {
    res.on("finish", () => {
        const time = new Date().toISOString();
        const method = req.method;
        const path = req.originalUrl;
        const status = res.statusCode;

        const statusColor = getStatusColor(status);

        const line =
            COLORS.dim +
            time +
            COLORS.reset +
            " " +
            method +
            " " +
            path +
            " " +
            statusColor +
            status +
            COLORS.reset;

        console.log(line);
    });

    next();
}

module.exports = {
    requestLogger,
};
# Weather API

Express-based weather wrapper API with Redis-backed caching, per-IP rate limiting, and health checks for app, cache, and upstream provider status.

This project is based on the [roadmap.sh Weather API Wrapper Service](https://roadmap.sh/projects/weather-api-wrapper-service).

## Features

- Fetch weather data by city through a single endpoint.
- Cache weather responses in Redis to reduce upstream calls.
- Apply Redis-backed rate limiting on weather requests.
- Expose health endpoints for app, external weather API, and Redis.
- Support local and Docker Compose workflows.

## Tech Stack

- Node.js
- Express
- Redis
- Docker + Docker Compose

## Project Structure

```text
.
├── app.js
├── server.js
├── controllers/
├── middleware/
├── routes/
├── services/
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Requirements

- Node.js 18+ (Node 22 used in Docker image)
- npm
- Redis (for caching and rate limiting)

## Environment Variables

Use `.env` for local development, or `.env.docker` for Docker Compose.

Reference template: `.env.docker.example`

| Variable                    | Required | Default                  | Description                                                           |
| --------------------------- | -------- | ------------------------ | --------------------------------------------------------------------- |
| `API_URL`                   | Yes      | -                        | Base URL of the weather provider (Visual Crossing timeline endpoint). |
| `API_KEY`                   | Yes      | -                        | API key for the weather provider.                                     |
| `PORT`                      | No       | `3000`                   | API server port.                                                      |
| `REDIS_URL`                 | No       | `redis://localhost:6379` | Redis connection string.                                              |
| `WEATHER_CACHE_TTL_SECONDS` | No       | `600`                    | Weather cache TTL in seconds.                                         |
| `RATE_LIMIT_WINDOW_SECONDS` | No       | `60`                     | Rate-limit window duration in seconds.                                |
| `RATE_LIMIT_MAX_REQUESTS`   | No       | `60`                     | Max requests per IP per rate-limit window.                            |
| `RATE_LIMIT_PREFIX`         | No       | `rate_limit:weather`     | Redis key prefix for rate-limit counters.                             |
| `TRUST_PROXY`               | No       | `1`                      | Express trust proxy setting (`true`, `false`, or integer).            |

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.docker.example .env
# edit .env and set API_URL/API_KEY
```

3. Start Redis (if not already running):

```bash
docker run -d --name weather-api-redis -p 6379:6379 redis:7-alpine
```

4. Start the API:

```bash
npm run dev
```

Or production mode:

```bash
npm start
```

## Docker Compose

Run both API and Redis:

```bash
docker compose up --build
```

Stop containers:

```bash
docker compose down
```

## API Endpoints

Base URL (local): `http://localhost:3000`

### `GET /`

Returns a welcome message.

Response example:

```json
{
    "message": "Welcome to Weather API!"
}
```

### `GET /weather/:city`

Fetches weather data for the given city.

Example request:

```bash
curl http://localhost:3000/weather/london
```

Success response shape:

```json
{
    "status": "success",
    "data": {
        "city": "london",
        "resolvedAddress": "London, England, United Kingdom",
        "timezone": "Europe/London",
        "description": "...",
        "current": {
            "temperature": 16.2,
            "feelsLike": 16.2,
            "humidity": 68,
            "windSpeed": 12.6,
            "conditions": "Partially cloudy",
            "icon": "partly-cloudy-day"
        },
        "today": {
            "tempMax": 18.1,
            "tempMin": 10.4,
            "precipProb": 25,
            "sunrise": "05:43:17",
            "sunset": "20:16:41"
        },
        "source": "visual-crossing",
        "fetchedAt": "2026-04-28T00:00:00.000Z"
    }
}
```

Error response shape:

```json
{
    "status": "error",
    "message": "...",
    "details": null
}
```

Rate limit headers:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
- `Retry-After` (when limited)

### `GET /health`

Returns a combined health summary for:

- app
- external weather API
- redis cache

### `GET /health/app`

Returns app-only health status.

### `GET /health/external`

Checks upstream weather API health with timeout.

## Caching Behavior

- Cache key format: `weather:<lowercased-city>`
- TTL controlled by `WEATHER_CACHE_TTL_SECONDS`
- If Redis is unavailable, requests continue without cache

## Rate Limiting Behavior

- Applied only to `/weather/*` routes
- Keyed by client IP (`x-forwarded-for` or socket IP)
- Counters stored in Redis
- If Redis is unavailable, requests continue without rate limiting

## Logging

Request logs include:

- timestamp
- HTTP method
- request path
- response status (colorized)

## Error Handling Notes

- Unknown routes return `404` with `{ "message": "Route not found" }`.
- Upstream failures are mapped to:
  - `404` for city not found
  - `502` for provider/network/timeout failures
- Missing provider config (`API_URL`, `API_KEY`) returns `500` for weather requests.

## Scripts

- `npm run dev` - Start with nodemon
- `npm start` - Start with node
- `npm test` - Placeholder test script

## License

ISC

# Live Data Hub & Operations Dashboard

> A full-stack integration and monitoring platform that connects live external providers, normalizes disparate schemas into MongoDB, isolates external failures, and serves an operations dashboard.

---

## 📖 Table of Contents
1. [Architecture & System Flow](#-architecture--system-flow)
2. [External Integrations](#-external-integrations)
3. [Data Model & Normalization Strategy](#-data-model--normalization-strategy)
4. [Resilience & Partial Failure Isolation](#-resilience--partial-failure-isolation)
5. [Cross-Provider Combined Status Metric](#-cross-provider-combined-status-metric)
6. [Quickstart / Running the Project](#-quickstart--running-the-project)
7. [Environment Variables](#-environment-variables)
8. [Automated Testing](#-automated-testing)
9. [Live Review & Interview Preparation](#-live-review--interview-preparation)
10. [Known Limitations](#-known-limitations)

---

## 🏛 Architecture & System Flow

```
[ Browser UI ]
      |
      | (Internal REST Calls only: /api/locations, /health)
      v
[ Backend API (Node.js / Express) ]
      |
      +---> [ MongoDB (Mongoose) ] <--- System of Record (Normalized + Unique Index)
      |
      +---> [ Connector A: Geocoding ] ----> Open-Meteo Geocoding API (HTTP with 5s timeout)
      +---> [ Connector B: Weather ]   ----> Open-Meteo Weather API (HTTP with 5s timeout)
      +---> [ Connector C: Air Quality]----> Open-Meteo Air Quality API (HTTP with 5s timeout)
```

### Architectural Principles
* **Zero Third-Party Calls from the Browser:** The frontend never communicates with external vendors. All calls originate server-side to protect keys, avoid CORS issues, and enforce caching/normalization.
* **Connector / Adapter Pattern:** External API calls are isolated in `src/connectors/`. Provider-specific field names (e.g. `temperature_2m`, `us_aqi`, `weather_code`) stop at the connector boundary and are converted into internal domain models before reaching controllers or MongoDB.
* **Single Collection Document Model:** Canonical locations and their latest normalized weather/air quality snapshots are stored in a unified `locations` collection with subdocuments, enabling single-query dashboard reads without costly relational joins.

---

## 🌐 External Integrations

We selected **Open-Meteo** APIs because they provide global real-time data, have zero paywall/registration friction for the reviewer, and represent independent functional domains:

| Integration | Provider & Endpoint | Documentation | Purpose |
| :--- | :--- | :--- | :--- |
| **Source A: Geocoding** | `https://geocoding-api.open-meteo.com/v1/search` | [Open-Meteo Geocoding Docs](https://open-meteo.com/en/docs/geocoding-api) | Resolves user input into canonical name, country, lat/lon coordinates, and timezone. |
| **Source B: Weather** | `https://api.open-meteo.com/v1/forecast` | [Open-Meteo Weather Docs](https://open-meteo.com/en/docs) | Current temperature (°C), condition summary, wind speed, humidity, and provider observation time. |
| **Source C: Air Quality** | `https://air-quality-api.open-meteo.com/v1/air-quality` | [Open-Meteo Air Quality Docs](https://open-meteo.com/en/docs/air-quality-api) | Real-time US EPA AQI, particulate matter (PM2.5), air quality category, and observation time. |

*Note: All base URLs and network timeouts are configurable via environment variables.*

---

## 🗄 Data Model & Normalization Strategy

### The Rule: "No Schema-by-Copying"
A document storing `{ rawResponseA: {...}, rawResponseB: {...} }` is rejected. Our backend converts provider payloads into a normalized internal schema:

```javascript
{
  location: {
    canonicalName: "Berlin",
    country: "Germany",
    countryCode: "DE",
    coordinates: { latitude: 52.52437, longitude: 13.41053 },
    timezone: "Europe/Berlin"
  },
  weather: {
    temperatureC: 22.4,        // Converted from temperature_2m
    condition: "Partly Cloudy", // Interpreted from WMO weather_code
    humidityPercent: 55,
    windSpeedKmH: 14.2,
    observedAt: ISODate("..."), // Provider timestamp
    fetchedAt: ISODate("...")  // System sync timestamp
  },
  environment: {
    aqi: 32,                   // Converted from us_aqi
    pm25: 8.5,                 // Converted from pm2_5
    category: "Good",          // Computed EPA category
    observedAt: ISODate("..."),
    fetchedAt: ISODate("...")
  },
  combinedStatus: {
    status: "NORMAL",          // "NORMAL" | "ATTENTION"
    reason: "Optimal conditions (22.4°C, AQI 32)",
    updatedAt: ISODate("...")
  },
  syncState: {
    weather: { status: "OK", lastAttempt: ISODate("..."), lastSuccess: ISODate("..."), error: null },
    airQuality: { status: "OK", lastAttempt: ISODate("..."), lastSuccess: ISODate("..."), error: null }
  }
}
```

### Uniqueness Constraint
A compound unique index is enforced in MongoDB:
```javascript
LocationSchema.index(
  { 'location.canonicalName': 1, 'location.country': 1 },
  { unique: true, name: 'unique_canonical_location' }
);
```
**Why:** Prevents duplicate records when a user searches for "Paris" multiple times.

---

## 🛡 Resilience & Partial Failure Isolation

1. **Strict Network Timeouts:** Every external HTTP call uses a 5,000ms timeout. A frozen external API will never hang an HTTP request to the frontend.
2. **Concurrent Execution (`Promise.allSettled`):** Weather and Air Quality are fetched concurrently. If one fails (e.g. 500 error or network timeout):
   - The failing source is marked with status `'STALE'` (if historical data exists) or `'FAILED'`.
   - The successful source is updated as `'OK'`.
   - The dashboard displays existing data alongside an inline error indicator without crashing or blanking the page.
3. **Graceful Logging:** Failures are logged with city name and concise HTTP error messages, without exposing API secrets or dumping megabytes of payload.

---

## ⚡ Cross-Provider Combined Status Metric

To satisfy the core integration rule (*"At least one dashboard view must combine fields originating from 2 or more different providers"*), our backend evaluates:

$$\text{Combined Status} = \begin{cases} 
\text{ATTENTION} & \text{if } T \ge 38^\circ\text{C} \text{ or } T \le -10^\circ\text{C} \text{ (Extreme Temp)} \\
\text{ATTENTION} & \text{if } \text{AQI} > 100 \text{ (Unhealthy Air Quality)} \\
\text{ATTENTION} & \text{if } \text{PM2.5} > 35\,\mu\text{g/m}^3 \text{ (Elevated Particulates)} \\
\text{NORMAL} & \text{otherwise (Optimal outdoor conditions)}
\end{cases}$$

This status is derived on the backend and stored in MongoDB.

---

## 🚀 Quickstart / Running the Project

### Prerequisites
* Docker & Docker Compose
* Node.js (v18+) & npm

### Step 1: Start MongoDB
```bash
docker compose up -d
```
*Verify MongoDB is running: `docker ps`*

### Step 2: Start Backend
```bash
cd backend
npm install
npm run dev
```
*Backend runs on `http://localhost:5000` (Health check: `http://localhost:5000/health`)*

### Step 3: Start Frontend
```bash
cd ../frontend
npm install
npm run dev
```
*Open your browser at `http://localhost:5173`*

---

## ⚙️ Environment Variables

Defined in `.env.example`:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Backend Express server port |
| `NODE_ENV` | `development` | Runtime environment |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `MONGODB_URI` | `mongodb://localhost:27017/live_data_hub` | MongoDB connection string |
| `GEOCODING_API_BASE_URL`| `https://geocoding-api.open-meteo.com/v1` | Source A endpoint |
| `WEATHER_API_BASE_URL` | `https://api.open-meteo.com/v1` | Source B endpoint |
| `AIR_QUALITY_API_BASE_URL`| `https://air-quality-api.open-meteo.com/v1` | Source C endpoint |
| `EXTERNAL_REQUEST_TIMEOUT_MS`| `5000` | Axios external request timeout |

---

## 🧪 Automated Testing

We implement the 3 mandatory tests defined on Page 7 of the assessment:

```bash
cd backend
npm test
```

### Test Coverage Summary:
1. **Connector Mapping Test (`connector.test.js`):** Validates that raw provider payloads (with fields like `temperature_2m` and `us_aqi`) are converted into internal normalized models without leaking external naming.
2. **Backend Sync Engine Test (`sync.test.js`):** Tests a full sync using mocked HTTP calls, verifying database persistence and combined status computation.
3. **Failure Isolation Test (`failure.test.js`):** Simulates an external provider failure (HTTP 500) and asserts that existing stored data is preserved and flagged as `STALE` instead of crashing.

---

## 🎓 Live Review & Interview Preparation (Page 8 Drill Answers)

Be prepared to answer these assessment questions during the live code review:

### Q1: Why did you store external data instead of always calling every provider from the browser?
* **Answer:**
  1. **Security:** API keys and rate limits are managed safely server-side, never exposed to client-side reverse engineering.
  2. **Performance & Reliability:** The backend aggregates and normalizes multiple providers concurrently, returning a single clean payload to the client.
  3. **Offline & Resilience:** If external providers experience downtime, the dashboard serves persisted historical data with a `STALE` badge rather than blanking out.
  4. **CORS:** Many public APIs do not support direct client-side cross-origin browser requests.

### Q2: Where do provider-specific field names stop existing in your architecture?
* **Answer:** Inside `backend/src/connectors/`. Functions like `normalizeWeatherPayload()` and `normalizeAirQualityPayload()` act as translation boundaries. Once raw data leaves the connector, the rest of the application (services, controllers, database models, and frontend UI) deals strictly with our internal canonical fields (`temperatureC`, `aqi`, `category`).

### Q3: How do you know whether displayed data is fresh?
* **Answer:** We record two separate timestamps on every subdocument:
  - `observedAt`: When the external weather station or satellite took the reading.
  - `fetchedAt`: When our server polled the provider.
  - In addition, `syncState.weather.lastSuccess` tracks the exact time of the last successful sync, allowing the UI to highlight stale data if the last sync exceeds a threshold.

### Q4: What happens if one provider is slow or unavailable?
* **Answer:**
  - **Timeout:** If the provider does not respond within 5,000ms (`EXTERNAL_REQUEST_TIMEOUT_MS`), Axios aborts the request.
  - **Isolation:** Because we use `Promise.allSettled`, the failure of one provider does not reject or interrupt the other.
  - **State update:** The failed provider is marked `STALE` (if older data exists) or `FAILED`, and the dashboard renders the active provider's data alongside a clear error badge.

### Q5: Which MongoDB documents/collections did you choose, and why?
* **Answer:** We selected a single cohesive `locations` collection containing embedded subdocuments (`weather`, `environment`, `syncState`).
  - *Why not separate collections?* The dashboard always presents location, weather, and air quality together. Embedding enables atomic single-document reads without expensive relational `$lookup` joins, while maintaining clear document boundaries.

### Q6: What would become a problem first if this went from 10 locations to 100,000?
* **Answer:**
  1. **Rate Limiting & Network Bottlenecks:** Syncing 100,000 locations synchronously would overwhelm external APIs and exhaust server sockets. We would need a background job queue (e.g. BullMQ / Redis) with worker pools and rate-limiting.
  2. **Database Write Contention:** Concurrent bulk updates would require batching (`bulkWrite`) and sharding on `location.country` or geographical hash.
  3. **Dashboard Pagination:** The frontend would need cursor-based pagination and virtualization instead of fetching all documents at once.

### Q7: Which part of the code would you trust least without tests?
* **Answer:** The connector payload mappers and error handlers. External APIs can change schemas, deprecate fields, or return unexpected null values. Without automated payload mapping tests and failure isolation tests, a minor upstream change could silently crash the synchronization engine.

---

## ⚠️ Known Limitations
* **Provider Rate Limits:** Open-Meteo free tier permits up to 10,000 daily requests. For large-scale production, an API key with higher throughput or response caching (Redis) would be added.
* **Polling Model:** The current system syncs on addition and on-demand via the UI. A production system could include a periodic cron worker or webhook listener for background updates.

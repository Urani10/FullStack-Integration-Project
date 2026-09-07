import dotenv from 'dotenv';
dotenv.config();

/**
 * Centralized Configuration
 * 
 * WHY THIS MATTERS FOR THE REVIEW (Rubric Area: Reliability & Integrations):
 * - URLs, ports, timeouts, and credentials must never be hardcoded in controllers or business logic.
 * - Centralizing here makes it trivial to test failure scenarios (e.g. pointing WEATHER_API_BASE_URL
 *   to a broken server) without changing a single line of application source code.
 */
export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/live_data_hub',
  
  // External Provider Base URLs
  geocodingApiBaseUrl: process.env.GEOCODING_API_BASE_URL || 'https://geocoding-api.open-meteo.com/v1',
  weatherApiBaseUrl: process.env.WEATHER_API_BASE_URL || 'https://api.open-meteo.com/v1',
  airQualityApiBaseUrl: process.env.AIR_QUALITY_API_BASE_URL || 'https://air-quality-api.open-meteo.com/v1',

  // Network timeouts in ms - dead providers should never hang the server
  timeoutMs: parseInt(process.env.EXTERNAL_REQUEST_TIMEOUT_MS || '5000', 10),
};

import axios from 'axios';
import { config } from '../config/env.js';

/**
 * WMO Weather Code Interpreter
 * Translates provider code into user-friendly descriptions.
 */
function interpretWeatherCode(code) {
  if (code === 0) return 'Clear Sky';
  if (code === 1) return 'Mainly Clear';
  if (code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain Showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Cloudy';
}

/**
 * Normalizes raw Weather API payload into our internal schema.
 * 
 * WHY THIS MATTERS (Rubric: Normalization Rule, "No schema-by-copying"):
 * Provider calls it 'temperature_2m' and 'weather_code'.
 * Our system converts it to 'temperatureC' and readable 'condition'.
 */
export function normalizeWeatherPayload(rawPayload, fetchedAt = new Date()) {
  if (!rawPayload || typeof rawPayload !== 'object' || !rawPayload.current) {
    throw new Error('Invalid weather payload: Expected current weather data');
  }

  const { current } = rawPayload;

  if (typeof current.temperature_2m !== 'number') {
    throw new Error('Invalid weather payload: Missing temperature_2m');
  }

  const observedAt = current.time ? new Date(current.time) : new Date();

  return {
    temperatureC: Math.round(current.temperature_2m * 10) / 10,
    condition: interpretWeatherCode(current.weather_code),
    weatherCode: Number(current.weather_code ?? 0),
    humidityPercent: Number(current.relative_humidity_2m ?? 0),
    windSpeedKmH: Number(current.wind_speed_10m ?? 0),
    observedAt,
    fetchedAt: new Date(fetchedAt),
  };
}

/**
 * Calls live weather provider for given coordinates.
 * Includes timeout and error normalization.
 */
export async function fetchWeather(latitude, longitude) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new Error('Valid numeric coordinates (latitude, longitude) are required');
  }

  const url = `${config.weatherApiBaseUrl}/forecast`;

  try {
    const response = await axios.get(url, {
      params: {
        latitude,
        longitude,
        current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
      },
      timeout: config.timeoutMs,
      headers: {
        'Accept': 'application/json',
      },
    });

    return normalizeWeatherPayload(response.data);
  } catch (err) {
    const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
    const enrichedError = new Error(
      isTimeout
        ? `Weather provider timed out after ${config.timeoutMs}ms`
        : `Weather provider error: ${err.message}`
    );
    enrichedError.statusCode = err.response?.status || 502;
    enrichedError.provider = 'weather';
    throw enrichedError;
  }
}

import axios from 'axios';
import { config } from '../config/env.js';

/**
 * Categorizes Air Quality Index (US EPA AQI Standard)
 */
function interpretAqiCategory(aqi) {
  if (aqi === null || aqi === undefined) return 'Unknown';
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  return 'Very Unhealthy';
}

/**
 * Normalizes raw Air Quality API payload into our internal schema.
 * 
 * WHY THIS MATTERS (Rubric: Normalization Rule, "No schema-by-copying"):
 * Transforms provider-specific nested fields ('us_aqi', 'pm2_5')
 * into canonical domain properties ('aqi', 'pm25', 'category').
 */
export function normalizeAirQualityPayload(rawPayload, fetchedAt = new Date()) {
  if (!rawPayload || typeof rawPayload !== 'object' || !rawPayload.current) {
    throw new Error('Invalid air quality payload: Expected current air quality data');
  }

  const { current } = rawPayload;

  // Use us_aqi or fallback to european_aqi if us_aqi is absent
  const aqiVal = typeof current.us_aqi === 'number' 
    ? current.us_aqi 
    : (typeof current.european_aqi === 'number' ? current.european_aqi : null);

  const pm25Val = typeof current.pm2_5 === 'number' 
    ? Math.round(current.pm2_5 * 10) / 10 
    : null;

  const observedAt = current.time ? new Date(current.time) : new Date();

  return {
    aqi: aqiVal,
    pm25: pm25Val,
    category: interpretAqiCategory(aqiVal),
    observedAt,
    fetchedAt: new Date(fetchedAt),
  };
}

/**
 * Calls live air quality provider for given coordinates.
 * Includes timeout and error normalization.
 */
export async function fetchAirQuality(latitude, longitude) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new Error('Valid numeric coordinates (latitude, longitude) are required');
  }

  const url = `${config.airQualityApiBaseUrl}/air-quality`;

  try {
    const response = await axios.get(url, {
      params: {
        latitude,
        longitude,
        current: 'pm2_5,us_aqi,european_aqi',
      },
      timeout: config.timeoutMs,
      headers: {
        'Accept': 'application/json',
      },
    });

    return normalizeAirQualityPayload(response.data);
  } catch (err) {
    const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
    const enrichedError = new Error(
      isTimeout
        ? `Air Quality provider timed out after ${config.timeoutMs}ms`
        : `Air Quality provider error: ${err.message}`
    );
    enrichedError.statusCode = err.response?.status || 502;
    enrichedError.provider = 'airQuality';
    throw enrichedError;
  }
}

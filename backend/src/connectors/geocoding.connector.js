import axios from 'axios';
import { config } from '../config/env.js';

/**
 * Normalizes raw Geocoding API payload into our internal canonical location model.
 * 
 * WHY SEPARATE THIS FUNCTION?
 * 1. Testability: Page 7 requires a unit test verifying provider payload -> internal normalized shape.
 * 2. Boundary: External field names like 'country_code' stop here and become our standard internal shape.
 */
export function normalizeGeocodingPayload(rawResult) {
  if (!rawResult || typeof rawResult !== 'object') {
    throw new Error('Invalid geocoding payload: Expected an object');
  }

  if (!rawResult.name || typeof rawResult.latitude !== 'number' || typeof rawResult.longitude !== 'number') {
    throw new Error('Invalid geocoding payload: Missing required name, latitude, or longitude');
  }

  return {
    canonicalName: String(rawResult.name).trim(),
    country: rawResult.country || 'Unknown',
    countryCode: (rawResult.country_code || '').toUpperCase(),
    coordinates: {
      latitude: Number(rawResult.latitude),
      longitude: Number(rawResult.longitude),
    },
    timezone: rawResult.timezone || 'UTC',
  };
}

/**
 * Resolves a city name query into a canonical location.
 * Uses strict network timeout to avoid hanging the server.
 */
export async function resolveCity(cityName) {
  if (!cityName || typeof cityName !== 'string' || !cityName.trim()) {
    throw new Error('A valid city name string is required');
  }

  const url = `${config.geocodingApiBaseUrl}/search`;

  try {
    const response = await axios.get(url, {
      params: {
        name: cityName.trim(),
        count: 1,
        language: 'en',
        format: 'json',
      },
      timeout: config.timeoutMs,
      headers: {
        'Accept': 'application/json',
      },
    });

    const results = response.data?.results;
    if (!results || !Array.isArray(results) || results.length === 0) {
      const error = new Error(`Location not found for "${cityName.trim()}"`);
      error.statusCode = 404;
      throw error;
    }

    return normalizeGeocodingPayload(results[0]);
  } catch (err) {
    if (err.statusCode === 404) {
      throw err;
    }
    // Handle Axios timeout or connection refusal
    const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
    const enrichedError = new Error(
      isTimeout
        ? `Geocoding provider timed out after ${config.timeoutMs}ms`
        : `Geocoding provider error: ${err.message}`
    );
    enrichedError.statusCode = 502; // Bad Gateway
    enrichedError.originalError = err;
    throw enrichedError;
  }
}

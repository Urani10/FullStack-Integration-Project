import { Location } from '../models/Location.js';
import { resolveCity } from '../connectors/geocoding.connector.js';
import { fetchWeather } from '../connectors/weather.connector.js';
import { fetchAirQuality } from '../connectors/airquality.connector.js';

/**
 * Derives a combined operational status from multiple providers.
 * 
 * MANDATORY REQUIREMENT (Page 2 & 5):
 * "At least one dashboard view must combine fields originating from 2 or more different providers.
 * Three unrelated API cards are not enough."
 */
export function calculateCombinedStatus(weather, environment) {
  const issues = [];

  const hasWeather = weather && typeof weather.temperatureC === 'number';
  const hasAqi = environment && typeof environment.aqi === 'number';

  if (!hasWeather && !hasAqi) {
    return {
      status: 'UNKNOWN',
      reason: 'No provider data available yet',
    };
  }

  // Weather rules (Source B)
  if (hasWeather) {
    if (weather.temperatureC >= 38) {
      issues.push(`Extreme heat (${weather.temperatureC}°C)`);
    } else if (weather.temperatureC <= -10) {
      issues.push(`Extreme cold (${weather.temperatureC}°C)`);
    }
  }

  // Air Quality rules (Source C)
  if (hasAqi) {
    if (environment.aqi > 100) {
      issues.push(`Poor air quality (AQI ${environment.aqi} - ${environment.category})`);
    } else if (environment.pm25 && environment.pm25 > 35) {
      issues.push(`Elevated PM2.5 (${environment.pm25} µg/m³)`);
    }
  }

  if (issues.length > 0) {
    return {
      status: 'ATTENTION',
      reason: issues.join(' & '),
    };
  }

  const details = [];
  if (hasWeather) details.push(`${weather.temperatureC}°C`);
  if (hasAqi) details.push(`AQI ${environment.aqi}`);

  return {
    status: 'NORMAL',
    reason: `Optimal conditions (${details.join(', ')})`,
  };
}

/**
 * Service for managing locations, syncing external providers, and isolating failures.
 */
export const locationService = {
  /**
   * Resolves canonical location and triggers initial sync.
   */
  async addLocation(cityName) {
    // 1. Resolve canonical location via Geocoding provider (Source A)
    const canonicalLocation = await resolveCity(cityName);

    // 2. Check for duplicate canonical location before creating
    const existing = await Location.findOne({
      'location.canonicalName': canonicalLocation.canonicalName,
      'location.country': canonicalLocation.country,
    });

    if (existing) {
      const conflictError = new Error(
        `Location "${canonicalLocation.canonicalName}, ${canonicalLocation.country}" is already added to your dashboard.`
      );
      conflictError.statusCode = 409;
      throw conflictError;
    }

    // 3. Create document
    const locationDoc = new Location({
      location: canonicalLocation,
    });

    // 4. Perform initial sync of live external sources
    await this.syncLocationDocument(locationDoc);

    return locationDoc;
  },

  /**
   * Refreshes external providers for a document with complete failure isolation.
   * 
   * FAILURE ISOLATION GUARANTEE:
   * - Weather and Air Quality are called concurrently with Promise.allSettled.
   * - If Weather fails, Air Quality still persists.
   * - Stored data from previous successful syncs is never wiped out.
   */
  async syncLocationDocument(locationDoc) {
    const { latitude, longitude } = locationDoc.location.coordinates;
    const now = new Date();

    // Call external providers concurrently
    const [weatherResult, airResult] = await Promise.allSettled([
      fetchWeather(latitude, longitude),
      fetchAirQuality(latitude, longitude),
    ]);

    // Handle Weather Result (Source B)
    locationDoc.syncState.weather.lastAttempt = now;
    if (weatherResult.status === 'fulfilled') {
      locationDoc.weather = weatherResult.value;
      locationDoc.syncState.weather.status = 'OK';
      locationDoc.syncState.weather.lastSuccess = now;
      locationDoc.syncState.weather.error = null;
    } else {
      // Mark STALE if previous data exists, otherwise FAILED
      locationDoc.syncState.weather.status = locationDoc.weather.observedAt ? 'STALE' : 'FAILED';
      locationDoc.syncState.weather.error = weatherResult.reason?.message || 'Weather fetch failed';
      console.warn(`[Sync Warning] Weather failed for ${locationDoc.location.canonicalName}:`, locationDoc.syncState.weather.error);
    }

    // Handle Air Quality Result (Source C)
    locationDoc.syncState.airQuality.lastAttempt = now;
    if (airResult.status === 'fulfilled') {
      locationDoc.environment = airResult.value;
      locationDoc.syncState.airQuality.status = 'OK';
      locationDoc.syncState.airQuality.lastSuccess = now;
      locationDoc.syncState.airQuality.error = null;
    } else {
      locationDoc.syncState.airQuality.status = locationDoc.environment.observedAt ? 'STALE' : 'FAILED';
      locationDoc.syncState.airQuality.error = airResult.reason?.message || 'Air Quality fetch failed';
      console.warn(`[Sync Warning] Air Quality failed for ${locationDoc.location.canonicalName}:`, locationDoc.syncState.airQuality.error);
    }

    // Derive cross-provider combined status
    const combined = calculateCombinedStatus(locationDoc.weather, locationDoc.environment);
    locationDoc.combinedStatus = {
      ...combined,
      updatedAt: now,
    };

    return await locationDoc.save();
  },

  /**
   * Sync by ID (used for manual refresh button).
   */
  async syncLocationById(id) {
    const locationDoc = await Location.findById(id);
    if (!locationDoc) {
      const err = new Error('Location not found');
      err.statusCode = 404;
      throw err;
    }
    return await this.syncLocationDocument(locationDoc);
  },

  /**
   * Lists all saved locations with optional query filters.
   */
  async listLocations({ country, status } = {}) {
    const query = {};
    if (country) {
      query['location.country'] = new RegExp(country, 'i');
    }
    if (status) {
      query['combinedStatus.status'] = status.toUpperCase();
    }
    return await Location.find(query).sort({ updatedAt: -1 });
  },

  /**
   * Retrieves single location details by ID.
   */
  async getLocationById(id) {
    const location = await Location.findById(id);
    if (!location) {
      const err = new Error('Location not found');
      err.statusCode = 404;
      throw err;
    }
    return location;
  },

  /**
   * Deletes a location by ID.
   */
  async deleteLocation(id) {
    const deleted = await Location.findByIdAndDelete(id);
    if (!deleted) {
      const err = new Error('Location not found');
      err.statusCode = 404;
      throw err;
    }
    return { success: true, id };
  },

  /**
   * Aggregates recent sync health across all locations.
   */
  async getIntegrationsStatus() {
    const locations = await Location.find({}, 'location syncState combinedStatus updatedAt');
    
    let weatherOk = 0, weatherStale = 0, weatherFailed = 0;
    let aqiOk = 0, aqiStale = 0, aqiFailed = 0;

    locations.forEach((loc) => {
      const wStatus = loc.syncState?.weather?.status;
      if (wStatus === 'OK') weatherOk++;
      else if (wStatus === 'STALE') weatherStale++;
      else weatherFailed++;

      const aStatus = loc.syncState?.airQuality?.status;
      if (aStatus === 'OK') aqiOk++;
      else if (aStatus === 'STALE') aqiStale++;
      else aqiFailed++;
    });

    return {
      totalLocations: locations.length,
      weather: { ok: weatherOk, stale: weatherStale, failed: weatherFailed },
      airQuality: { ok: aqiOk, stale: aqiStale, failed: aqiFailed },
      timestamp: new Date(),
    };
  },
};

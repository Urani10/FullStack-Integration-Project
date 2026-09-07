import { describe, it, expect } from 'vitest';
import { normalizeGeocodingPayload } from '../src/connectors/geocoding.connector.js';
import { normalizeWeatherPayload } from '../src/connectors/weather.connector.js';
import { normalizeAirQualityPayload } from '../src/connectors/airquality.connector.js';

describe('Connector Mapping Tests (Provider Payload -> Internal Normalized Shape)', () => {
  it('should map Open-Meteo geocoding payload to internal canonical location', () => {
    const rawGeocodingPayload = {
      id: 2950159,
      name: 'Berlin',
      latitude: 52.52437,
      longitude: 13.41053,
      country_code: 'DE',
      country: 'Germany',
      timezone: 'Europe/Berlin',
    };

    const normalized = normalizeGeocodingPayload(rawGeocodingPayload);

    expect(normalized).toEqual({
      canonicalName: 'Berlin',
      country: 'Germany',
      countryCode: 'DE',
      coordinates: {
        latitude: 52.52437,
        longitude: 13.41053,
      },
      timezone: 'Europe/Berlin',
    });
  });

  it('should map Open-Meteo weather payload into normalized weather object', () => {
    const rawWeatherPayload = {
      latitude: 52.52,
      longitude: 13.41,
      current: {
        time: '2026-09-07T12:00',
        temperature_2m: 23.4,
        relative_humidity_2m: 55,
        weather_code: 1, // Mainly Clear
        wind_speed_10m: 14.2,
      },
    };

    const fixedFetchTime = new Date('2026-09-07T12:01:00Z');
    const normalized = normalizeWeatherPayload(rawWeatherPayload, fixedFetchTime);

    expect(normalized.temperatureC).toBe(23.4);
    expect(normalized.condition).toBe('Mainly Clear');
    expect(normalized.weatherCode).toBe(1);
    expect(normalized.humidityPercent).toBe(55);
    expect(normalized.windSpeedKmH).toBe(14.2);
    expect(normalized.observedAt).toEqual(new Date('2026-09-07T12:00'));
    expect(normalized.fetchedAt).toEqual(fixedFetchTime);
    // External field names must not exist
    expect(normalized.temperature_2m).toBeUndefined();
    expect(normalized.weather_code).toBeUndefined();
  });

  it('should map Open-Meteo air quality payload into normalized environment object', () => {
    const rawAirPayload = {
      latitude: 52.52,
      longitude: 13.41,
      current: {
        time: '2026-09-07T12:00',
        pm2_5: 12.3,
        us_aqi: 45,
        european_aqi: 20,
      },
    };

    const fixedFetchTime = new Date('2026-09-07T12:01:00Z');
    const normalized = normalizeAirQualityPayload(rawAirPayload, fixedFetchTime);

    expect(normalized.aqi).toBe(45);
    expect(normalized.pm25).toBe(12.3);
    expect(normalized.category).toBe('Good');
    expect(normalized.observedAt).toEqual(new Date('2026-09-07T12:00'));
    expect(normalized.fetchedAt).toEqual(fixedFetchTime);
    // Provider specific fields must not leak
    expect(normalized.us_aqi).toBeUndefined();
    expect(normalized.pm2_5).toBeUndefined();
  });
});

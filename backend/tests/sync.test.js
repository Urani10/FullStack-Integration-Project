import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { locationService } from '../src/services/location.service.js';

// Mock Axios
vi.mock('axios');

describe('Sync Engine Tests (Successful Sync with Mocked HTTP Calls)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully sync both weather and air quality providers and derive NORMAL status', async () => {
    // Mock Weather API response
    const mockWeatherResponse = {
      data: {
        latitude: 48.85,
        longitude: 2.35,
        current: {
          time: '2026-09-07T14:00',
          temperature_2m: 21.5,
          relative_humidity_2m: 50,
          weather_code: 0, // Clear Sky
          wind_speed_10m: 10.0,
        },
      },
    };

    // Mock Air Quality API response
    const mockAirResponse = {
      data: {
        latitude: 48.85,
        longitude: 2.35,
        current: {
          time: '2026-09-07T14:00',
          pm2_5: 8.0,
          us_aqi: 32,
          european_aqi: 15,
        },
      },
    };

    axios.get.mockImplementation((url) => {
      if (url.includes('forecast')) {
        return Promise.resolve(mockWeatherResponse);
      }
      if (url.includes('air-quality')) {
        return Promise.resolve(mockAirResponse);
      }
      return Promise.reject(new Error('Unknown URL in test mock'));
    });

    // Create mock document object with save() mock
    const mockDoc = {
      location: {
        canonicalName: 'Paris',
        country: 'France',
        coordinates: { latitude: 48.85, longitude: 2.35 },
      },
      weather: {},
      environment: {},
      combinedStatus: {},
      syncState: {
        weather: {},
        airQuality: {},
      },
      save: vi.fn().mockResolvedValue(true),
    };

    const result = await locationService.syncLocationDocument(mockDoc);

    // Assert save was called
    expect(mockDoc.save).toHaveBeenCalledTimes(1);

    // Verify weather normalized fields
    expect(mockDoc.weather.temperatureC).toBe(21.5);
    expect(mockDoc.weather.condition).toBe('Clear Sky');
    expect(mockDoc.syncState.weather.status).toBe('OK');
    expect(mockDoc.syncState.weather.error).toBeNull();

    // Verify air quality normalized fields
    expect(mockDoc.environment.aqi).toBe(32);
    expect(mockDoc.environment.category).toBe('Good');
    expect(mockDoc.syncState.airQuality.status).toBe('OK');
    expect(mockDoc.syncState.airQuality.error).toBeNull();

    // Verify cross-provider combined status
    expect(mockDoc.combinedStatus.status).toBe('NORMAL');
    expect(mockDoc.combinedStatus.reason).toContain('Optimal conditions');
  });
});

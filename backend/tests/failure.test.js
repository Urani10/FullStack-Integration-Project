import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { locationService } from '../src/services/location.service.js';

vi.mock('axios');

describe('Failure Isolation Tests (Surviving Provider Error Without Data Loss)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should retain existing weather data when weather provider fails, while updating air quality', async () => {
    const previousObservedAt = new Date('2026-09-07T10:00:00Z');
    
    // Existing document with historical data
    const mockDoc = {
      location: {
        canonicalName: 'Tokyo',
        country: 'Japan',
        coordinates: { latitude: 35.68, longitude: 139.76 },
      },
      weather: {
        temperatureC: 25.0,
        condition: 'Clear Sky',
        weatherCode: 0,
        humidityPercent: 60,
        windSpeedKmH: 8.0,
        observedAt: previousObservedAt,
        fetchedAt: previousObservedAt,
      },
      environment: {
        aqi: null,
      },
      combinedStatus: {
        status: 'NORMAL',
        reason: 'Optimal',
      },
      syncState: {
        weather: { status: 'OK', error: null },
        airQuality: { status: 'PENDING', error: null },
      },
      save: vi.fn().mockResolvedValue(true),
    };

    // Simulate Weather provider outage (500) and Air Quality provider success
    axios.get.mockImplementation((url) => {
      if (url.includes('forecast')) {
        const networkError = new Error('Weather API 500 Internal Server Error');
        networkError.response = { status: 500 };
        return Promise.reject(networkError);
      }
      if (url.includes('air-quality')) {
        return Promise.resolve({
          data: {
            latitude: 35.68,
            longitude: 139.76,
            current: {
              time: '2026-09-07T14:30',
              pm2_5: 38.0,
              us_aqi: 110,
              european_aqi: 60,
            },
          },
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    // Run sync
    await locationService.syncLocationDocument(mockDoc);

    // 1. Weather data MUST be preserved (NOT wiped or nullified)
    expect(mockDoc.weather.temperatureC).toBe(25.0);
    expect(mockDoc.weather.condition).toBe('Clear Sky');
    expect(mockDoc.weather.observedAt).toEqual(previousObservedAt);

    // 2. Weather syncState must reflect STALE because existing data was retained
    expect(mockDoc.syncState.weather.status).toBe('STALE');
    expect(mockDoc.syncState.weather.error).toContain('Weather API 500');

    // 3. Air quality succeeded and updated
    expect(mockDoc.syncState.airQuality.status).toBe('OK');
    expect(mockDoc.environment.aqi).toBe(110);
    expect(mockDoc.environment.category).toBe('Unhealthy for Sensitive Groups');

    // 4. Combined status was calculated with air quality alert
    expect(mockDoc.combinedStatus.status).toBe('ATTENTION');
    expect(mockDoc.combinedStatus.reason).toContain('Poor air quality');

    // 5. Document was safely saved to DB
    expect(mockDoc.save).toHaveBeenCalledTimes(1);
  });
});

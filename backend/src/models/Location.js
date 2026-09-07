import mongoose from 'mongoose';

/**
 * Mongoose Schema for Saved Locations and Normalized Data
 * 
 * WHY THIS DOCUMENT BOUNDARY DESIGN?
 * - An operations dashboard queries locations with their latest weather and air quality simultaneously.
 * - Storing weather and environment as embedded subdocuments under the canonical location enables
 *   atomic single-document reads without expensive relational joins ($lookup), while still keeping
 *   sync metadata cleanly partitioned.
 */
const LocationSchema = new mongoose.Schema(
  {
    location: {
      canonicalName: {
        type: String,
        required: [true, 'Canonical city name is required'],
        trim: true,
      },
      country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
      },
      countryCode: {
        type: String,
        trim: true,
        uppercase: true,
      },
      coordinates: {
        latitude: {
          type: Number,
          required: [true, 'Latitude is required'],
        },
        longitude: {
          type: Number,
          required: [true, 'Longitude is required'],
        },
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
    },

    weather: {
      temperatureC: { type: Number, default: null },
      condition: { type: String, default: null },
      weatherCode: { type: Number, default: null },
      humidityPercent: { type: Number, default: null },
      windSpeedKmH: { type: Number, default: null },
      observedAt: { type: Date, default: null }, // Provider's timestamp
      fetchedAt: { type: Date, default: null },  // Our system fetch timestamp
    },

    environment: {
      aqi: { type: Number, default: null },
      pm25: { type: Number, default: null },
      category: { type: String, default: null },
      observedAt: { type: Date, default: null },
      fetchedAt: { type: Date, default: null },
    },

    // Combined metric derived from 2+ providers (Weather + Air Quality)
    combinedStatus: {
      status: {
        type: String,
        enum: ['NORMAL', 'ATTENTION', 'UNKNOWN'],
        default: 'UNKNOWN',
      },
      reason: {
        type: String,
        default: 'Awaiting sync',
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },

    // Per-source operational tracking for failure isolation & visibility
    syncState: {
      weather: {
        status: {
          type: String,
          enum: ['OK', 'STALE', 'FAILED', 'PENDING'],
          default: 'PENDING',
        },
        lastAttempt: { type: Date, default: null },
        lastSuccess: { type: Date, default: null },
        error: { type: String, default: null },
      },
      airQuality: {
        status: {
          type: String,
          enum: ['OK', 'STALE', 'FAILED', 'PENDING'],
          default: 'PENDING',
        },
        lastAttempt: { type: Date, default: null },
        lastSuccess: { type: Date, default: null },
        error: { type: String, default: null },
      },
    },
  },
  {
    timestamps: true, // Automatically provides createdAt and updatedAt
  }
);

/**
 * MANDATORY REQUIREMENT: Uniqueness Constraint & Indexing
 * Prevents identical canonical locations (e.g. "Paris, France") from being duplicated.
 */
LocationSchema.index(
  { 'location.canonicalName': 1, 'location.country': 1 },
  { unique: true, name: 'unique_canonical_location' }
);

export const Location = mongoose.model('Location', LocationSchema);

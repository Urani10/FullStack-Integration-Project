import { locationService } from '../services/location.service.js';

export const locationController = {
  /**
   * POST /api/locations
   * Add a city and resolve it through Source A + sync Sources B & C.
   */
  async addLocation(req, res, next) {
    try {
      const { cityName } = req.body;

      if (!cityName || typeof cityName !== 'string' || !cityName.trim()) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Field "cityName" is required and must be a non-empty string.',
        });
      }

      const location = await locationService.addLocation(cityName.trim());
      return res.status(201).json(location);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/locations
   * List saved locations with latest combined data and optional filters.
   */
  async listLocations(req, res, next) {
    try {
      const { country, status } = req.query;
      const locations = await locationService.listLocations({ country, status });
      return res.json(locations);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/locations/:id
   * Get single location details.
   */
  async getLocationById(req, res, next) {
    try {
      const location = await locationService.getLocationById(req.params.id);
      return res.json(location);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/locations/:id/sync
   * Manually trigger refresh of external sources for a location.
   */
  async syncLocation(req, res, next) {
    try {
      const updated = await locationService.syncLocationById(req.params.id);
      return res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/locations/:id
   * Remove a location from the dashboard.
   */
  async deleteLocation(req, res, next) {
    try {
      const result = await locationService.deleteLocation(req.params.id);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/integrations/status
   * Summary of recent source health and sync counts.
   */
  async getIntegrationsStatus(req, res, next) {
    try {
      const status = await locationService.getIntegrationsStatus();
      return res.json(status);
    } catch (err) {
      next(err);
    }
  },
};

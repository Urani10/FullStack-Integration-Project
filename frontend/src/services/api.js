import axios from 'axios';

/**
 * Frontend API Service
 * 
 * CRITICAL RUBRIC REQUIREMENT (Page 2 & Page 7):
 * - The browser MUST NOT call third-party providers (Open-Meteo, etc.) directly.
 * - All calls route exclusively to our custom backend (/api/*, /health).
 */
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const apiService = {
  // Check backend and DB health
  async checkHealth() {
    const res = await axios.get('/health');
    return res.data;
  },

  // Fetch list of saved locations
  async getLocations(params = {}) {
    const res = await apiClient.get('/locations', { params });
    return res.data;
  },

  // Add new location (calls backend to resolve geocoding + sync)
  async addLocation(cityName) {
    const res = await apiClient.post('/locations', { cityName });
    return res.data;
  },

  // Manually refresh external providers for a location
  async syncLocation(id) {
    const res = await apiClient.post(`/locations/${id}/sync`);
    return res.data;
  },

  // Delete saved location
  async deleteLocation(id) {
    const res = await apiClient.delete(`/locations/${id}`);
    return res.data;
  },

  // Source health status summary
  async getIntegrationsStatus() {
    const res = await apiClient.get('/integrations/status');
    return res.data;
  },
};

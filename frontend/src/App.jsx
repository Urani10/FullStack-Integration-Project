import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { IntegrationStatusBar } from './components/IntegrationStatusBar';
import { LocationCard } from './components/LocationCard';
import { AddLocationModal } from './components/AddLocationModal';
import { LocationDetailModal } from './components/LocationDetailModal';
import { apiService } from './services/api';
import { Globe, Plus, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';

export default function App() {
  const [locations, setLocations] = useState([]);
  const [integrationStats, setIntegrationStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals & UI filters
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLocationForDetail, setSelectedLocationForDetail] = useState(null);
  const [filterCountry, setFilterCountry] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Fetch locations from internal backend
  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const [locsData, statsData, healthData] = await Promise.all([
        apiService.getLocations({
          country: filterCountry || undefined,
          status: filterStatus || undefined,
        }),
        apiService.getIntegrationsStatus().catch(() => null),
        apiService.checkHealth().catch((err) => ({ status: 'degraded', error: err.message })),
      ]);

      setLocations(locsData);
      setIntegrationStats(statsData);
      setHealth(healthData);
    } catch (err) {
      console.error('[Dashboard Error] Failed to load data:', err);
      setError('Unable to connect to backend service. Ensure MongoDB and Express are running.');
    } finally {
      setLoading(false);
    }
  }, [filterCountry, filterStatus]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Periodic health check every 15s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const h = await apiService.checkHealth();
        setHealth(h);
      } catch {
        setHealth({ status: 'degraded' });
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handler: Add Location
  const handleAddLocation = async (cityName) => {
    const newLocation = await apiService.addLocation(cityName);
    // Refresh list so new location appears with live synced data
    await fetchDashboardData();
    return newLocation;
  };

  // Handler: Sync Location
  const handleSyncLocation = async (id) => {
    const updated = await apiService.syncLocation(id);
    setLocations((prev) => prev.map((loc) => (loc._id === id ? updated : loc)));
    // Refresh global stats
    const stats = await apiService.getIntegrationsStatus().catch(() => null);
    if (stats) setIntegrationStats(stats);
  };

  // Handler: Delete Location
  const handleDeleteLocation = async (id) => {
    if (!window.confirm('Are you sure you want to remove this location?')) return;
    await apiService.deleteLocation(id);
    setLocations((prev) => prev.filter((loc) => loc._id !== id));
    const stats = await apiService.getIntegrationsStatus().catch(() => null);
    if (stats) setIntegrationStats(stats);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      
      {/* Top Header */}
      <Header
        onOpenAddModal={() => setIsAddModalOpen(true)}
        health={health}
        onRefreshAll={fetchDashboardData}
        filterCountry={filterCountry}
        setFilterCountry={setFilterCountry}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Backend / MongoDB Disconnected Banner */}
        {health && health.status !== 'ok' && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <div>
                <span className="font-bold">Backend Service Degraded:</span> MongoDB connection is unreachable or offline.
              </div>
            </div>
            <button
              onClick={fetchDashboardData}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Global Integrations Status Bar */}
        <IntegrationStatusBar stats={integrationStats} />

        {/* Content States */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm">Loading monitoring data from MongoDB...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Failed to Connect</h3>
            <p className="text-sm text-slate-400 mb-4">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Connection</span>
            </button>
          </div>
        ) : locations.length === 0 ? (
          /* Empty State */
          <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl p-8 max-w-lg mx-auto">
            <div className="p-3 bg-blue-600/10 text-blue-400 rounded-2xl inline-block mb-4">
              <Globe className="w-10 h-10" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">No Monitored Locations Yet</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Add your first city to watch our backend discover canonical coordinates, normalize multiple live external APIs, and serve real-time operations data.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add First City</span>
            </button>
          </div>
        ) : (
          /* Locations Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {locations.map((loc) => (
              <LocationCard
                key={loc._id}
                location={loc}
                onSync={handleSyncLocation}
                onDelete={handleDeleteLocation}
                onOpenDetails={(item) => setSelectedLocationForDetail(item)}
              />
            ))}
          </div>
        )}

      </main>

      {/* Modals */}
      <AddLocationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddLocation={handleAddLocation}
      />

      <LocationDetailModal
        location={selectedLocationForDetail}
        onClose={() => setSelectedLocationForDetail(null)}
      />

      {/* Minimal Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-[11px] text-slate-600">
        Live Data Hub & Operations Dashboard · Junior Full-Stack Integration Assessment
      </footer>

    </div>
  );
}

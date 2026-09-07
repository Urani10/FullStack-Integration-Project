import React, { useState } from 'react';
import { X, MapPin, Cloud, Wind, CheckCircle2, AlertTriangle, Code, Clock } from 'lucide-react';

export function LocationDetailModal({ location, onClose }) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'json'

  if (!location) return null;

  const { canonicalName, country, countryCode, coordinates, timezone } = location.location;
  const { weather, environment, combinedStatus, syncState, createdAt, updatedAt } = location;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">
                {canonicalName}, {country}
              </h2>
              {countryCode && (
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                  {countryCode}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Coordinates: {coordinates.latitude}°, {coordinates.longitude}° · Timezone: {timezone}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex space-x-4 border-b border-slate-800 my-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('summary')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'summary' 
                ? 'border-blue-500 text-blue-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Normalized Overview
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`pb-2 border-b-2 transition-colors flex items-center space-x-1 ${
              activeTab === 'json' 
                ? 'border-blue-500 text-blue-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>MongoDB Document (No Raw Blobs)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto flex-1 pr-1">
          {activeTab === 'summary' ? (
            <div className="space-y-4 text-xs">
              
              {/* Combined Status Logic Callout */}
              <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl">
                <span className="font-semibold text-slate-300 block mb-1">
                  Derived Cross-Provider Status:
                </span>
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    combinedStatus?.status === 'ATTENTION' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {combinedStatus?.status}
                  </span>
                  <span className="text-slate-300">{combinedStatus?.reason}</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Calculated dynamically from Weather (Source B) and Air Quality (Source C) metrics against documented health thresholds.
                </p>
              </div>

              {/* Weather Breakdown */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between font-semibold text-slate-300 mb-2">
                  <span className="flex items-center space-x-1.5 text-sky-400">
                    <Cloud className="w-4 h-4" />
                    <span>Weather (Source B)</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Status: {syncState?.weather?.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300 text-xs">
                  <div>Temp: <span className="font-bold text-white">{weather?.temperatureC ?? '--'}°C</span></div>
                  <div>Condition: <span className="text-white">{weather?.condition ?? '--'}</span></div>
                  <div>Humidity: <span className="text-white">{weather?.humidityPercent ?? '--'}%</span></div>
                  <div>Wind: <span className="text-white">{weather?.windSpeedKmH ?? '--'} km/h</span></div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap gap-3 text-[11px] text-slate-500">
                  <span>Observed: {weather?.observedAt ? new Date(weather.observedAt).toLocaleString() : 'N/A'}</span>
                  <span>Fetched: {weather?.fetchedAt ? new Date(weather.fetchedAt).toLocaleString() : 'N/A'}</span>
                </div>
              </div>

              {/* Air Quality Breakdown */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between font-semibold text-slate-300 mb-2">
                  <span className="flex items-center space-x-1.5 text-emerald-400">
                    <Wind className="w-4 h-4" />
                    <span>Air Quality / Environment (Source C)</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Status: {syncState?.airQuality?.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-300 text-xs">
                  <div>US AQI: <span className="font-bold text-white">{environment?.aqi ?? '--'}</span></div>
                  <div>PM2.5: <span className="text-white">{environment?.pm25 ?? '--'} µg/m³</span></div>
                  <div>Category: <span className="text-emerald-400 font-medium">{environment?.category ?? '--'}</span></div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap gap-3 text-[11px] text-slate-500">
                  <span>Observed: {environment?.observedAt ? new Date(environment.observedAt).toLocaleString() : 'N/A'}</span>
                  <span>Fetched: {environment?.fetchedAt ? new Date(environment.fetchedAt).toLocaleString() : 'N/A'}</span>
                </div>
              </div>

              {/* Record Timestamps */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2">
                <span>Created: {new Date(createdAt).toLocaleString()}</span>
                <span>Last Modified: {new Date(updatedAt).toLocaleString()}</span>
              </div>

            </div>
          ) : (
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
              {JSON.stringify(location, null, 2)}
            </pre>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-800 mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  CloudSun, 
  Wind, 
  RefreshCw, 
  Trash2, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MapPin,
  Thermometer,
  Gauge
} from 'lucide-react';

export function LocationCard({ location, onSync, onDelete, onOpenDetails }) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncClick = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await onSync(location._id);
    } finally {
      setIsSyncing(false);
    }
  };

  const { canonicalName, country, countryCode, coordinates, timezone } = location.location;
  const { weather, environment, combinedStatus, syncState, updatedAt } = location;

  // Formatting helpers
  const formatTime = (isoString) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getStatusBadge = (statusObj) => {
    const status = statusObj?.status || 'PENDING';
    if (status === 'OK') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-2.5 h-2.5" />
          <span>OK</span>
        </span>
      );
    }
    if (status === 'STALE') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-2.5 h-2.5" />
          <span>STALE</span>
        </span>
      );
    }
    if (status === 'FAILED') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <XCircle className="w-2.5 h-2.5" />
          <span>FAILED</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700/50 text-slate-400">
        <span>PENDING</span>
      </span>
    );
  };

  const isAttention = combinedStatus?.status === 'ATTENTION';

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all duration-200">
      
      {/* Top Header: Canonical Location & Action Buttons */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <h3 className="text-base font-bold text-white tracking-tight truncate">
                {canonicalName}
              </h3>
              {countryCode && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                  {countryCode}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {country} · <span className="text-slate-500">{coordinates.latitude.toFixed(2)}°, {coordinates.longitude.toFixed(2)}°</span>
            </p>
          </div>

          {/* Actions: Refresh & Delete */}
          <div className="flex items-center space-x-1">
            <button
              onClick={handleSyncClick}
              disabled={isSyncing}
              title="Refresh live sources"
              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
            </button>
            <button
              onClick={() => onOpenDetails(location)}
              title="View normalized details"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(location._id)}
              title="Remove location"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cross-Provider Combined Status Banner */}
        <div className={`mb-4 px-3 py-2 rounded-xl border flex items-center justify-between text-xs ${
          isAttention 
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        }`}>
          <div className="flex items-center space-x-2">
            {isAttention ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              {combinedStatus?.status || 'NORMAL'}
            </span>
          </div>
          <span className="text-[11px] text-slate-300 truncate max-w-[200px]" title={combinedStatus?.reason}>
            {combinedStatus?.reason}
          </span>
        </div>

        {/* 2-Column Grid: Weather & Air Quality */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          
          {/* Source B: Weather Panel */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-400 flex items-center space-x-1">
                  <CloudSun className="w-3.5 h-3.5 text-sky-400" />
                  <span>Weather</span>
                </span>
                {getStatusBadge(syncState?.weather)}
              </div>

              {typeof weather?.temperatureC === 'number' ? (
                <div>
                  <div className="text-2xl font-extrabold text-white tracking-tight flex items-baseline">
                    {weather.temperatureC}°<span className="text-xs font-normal text-slate-400 ml-0.5">C</span>
                  </div>
                  <div className="text-xs text-slate-300 font-medium truncate mt-0.5">
                    {weather.condition || 'Unknown'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Wind: {weather.windSpeedKmH ?? '--'} km/h · Hum: {weather.humidityPercent ?? '--'}%
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 py-3">No weather data</div>
              )}
            </div>

            {/* Error badge if provider failed */}
            {syncState?.weather?.error && (
              <div className="mt-2 text-[10px] text-rose-400 bg-rose-500/10 p-1.5 rounded border border-rose-500/20 truncate" title={syncState.weather.error}>
                {syncState.weather.error}
              </div>
            )}
          </div>

          {/* Source C: Air Quality Panel */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-400 flex items-center space-x-1">
                  <Wind className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Air Quality</span>
                </span>
                {getStatusBadge(syncState?.airQuality)}
              </div>

              {typeof environment?.aqi === 'number' ? (
                <div>
                  <div className="text-2xl font-extrabold text-white tracking-tight flex items-baseline">
                    {environment.aqi}
                    <span className="text-xs font-normal text-slate-400 ml-1">AQI</span>
                  </div>
                  <div className="text-xs text-emerald-400 font-medium truncate mt-0.5">
                    {environment.category || 'Good'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    PM2.5: {environment.pm25 ?? '--'} µg/m³
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 py-3">No air quality data</div>
              )}
            </div>

            {/* Error badge if provider failed */}
            {syncState?.airQuality?.error && (
              <div className="mt-2 text-[10px] text-rose-400 bg-rose-500/10 p-1.5 rounded border border-rose-500/20 truncate" title={syncState.airQuality.error}>
                {syncState.airQuality.error}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Card Footer: Timestamps & Freshness */}
      <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>Synced: {formatTime(updatedAt)}</span>
        </span>
        <span className="text-[10px] text-slate-600 font-mono">
          TZ: {timezone}
        </span>
      </div>

    </div>
  );
}

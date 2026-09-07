import React from 'react';
import { CloudRain, Wind, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export function IntegrationStatusBar({ stats }) {
  if (!stats || stats.totalLocations === 0) return null;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-6 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Integrations Health Overview
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Active monitoring across {stats.totalLocations} canonical location{stats.totalLocations > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* Source B: Weather Status */}
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50">
            <CloudRain className="w-4 h-4 text-sky-400" />
            <span className="text-slate-300 font-medium">Weather Provider:</span>
            <span className="flex items-center space-x-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{stats.weather.ok} OK</span>
            </span>
            {stats.weather.stale > 0 && (
              <span className="flex items-center space-x-1 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{stats.weather.stale} Stale</span>
              </span>
            )}
            {stats.weather.failed > 0 && (
              <span className="flex items-center space-x-1 text-rose-400">
                <XCircle className="w-3.5 h-3.5" />
                <span>{stats.weather.failed} Failed</span>
              </span>
            )}
          </div>

          {/* Source C: Air Quality Status */}
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50">
            <Wind className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300 font-medium">Air Quality Provider:</span>
            <span className="flex items-center space-x-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{stats.airQuality.ok} OK</span>
            </span>
            {stats.airQuality.stale > 0 && (
              <span className="flex items-center space-x-1 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{stats.airQuality.stale} Stale</span>
              </span>
            )}
            {stats.airQuality.failed > 0 && (
              <span className="flex items-center space-x-1 text-rose-400">
                <XCircle className="w-3.5 h-3.5" />
                <span>{stats.airQuality.failed} Failed</span>
              </span>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

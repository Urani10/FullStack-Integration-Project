import React from 'react';
import { Activity, Plus, Database, Server, RefreshCw } from 'lucide-react';

export function Header({ 
  onOpenAddModal, 
  health, 
  onRefreshAll, 
  filterCountry, 
  setFilterCountry, 
  filterStatus, 
  setFilterStatus 
}) {
  const isHealthy = health?.status === 'ok';

  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white">Live Data Hub</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                  Ops Dashboard
                </span>
              </div>
              <p className="text-xs text-slate-400">Multi-source live integration & normalization engine</p>
            </div>
          </div>

          {/* System Health Indicators & Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Backend & MongoDB Health Indicator */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <div className="flex items-center space-x-1.5">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-300">API</span>
                <span className={`w-2 h-2 rounded-full ${health ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-300">MongoDB</span>
                <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              </div>
            </div>

            {/* Add City Button */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors shadow-sm shadow-blue-600/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4" />
              <span>Add Location</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center gap-3 text-xs">
          <span className="text-slate-400 font-medium">Filter by:</span>
          
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-2.5 py-1 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="NORMAL">Normal</option>
            <option value="ATTENTION">Attention</option>
          </select>

          {/* Country Search */}
          <input
            type="text"
            placeholder="Search country..."
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-2.5 py-1 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
          />

          {(filterCountry || filterStatus) && (
            <button
              onClick={() => { setFilterCountry(''); setFilterStatus(''); }}
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2 ml-1"
            >
              Clear filters
            </button>
          )}
        </div>

      </div>
    </header>
  );
}

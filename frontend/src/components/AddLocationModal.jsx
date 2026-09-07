import React, { useState } from 'react';
import { X, Search, Loader2, AlertCircle } from 'lucide-react';

export function AddLocationModal({ isOpen, onClose, onAddLocation }) {
  const [cityName, setCityName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cityName.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onAddLocation(cityName.trim());
      setCityName('');
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to add location';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Add Monitored Location</h2>
            <p className="text-xs text-slate-400">Resolves coordinates and connects live data</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start space-x-2 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                City / Location Name
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Paris, Tokyo, San Francisco, Cairo..."
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <p className="text-[11px] text-slate-500">
              Backend will call Source A (Geocoding) to resolve canonical coordinates, then automatically sync Source B (Weather) and Source C (Air Quality).
            </p>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !cityName.trim()}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors shadow-sm shadow-blue-600/30"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Resolving & Syncing...</span>
                </>
              ) : (
                <span>Add & Sync Location</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

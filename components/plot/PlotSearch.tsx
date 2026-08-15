'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plot } from '@/types';
import { Search, X, Check, ArrowRight } from 'lucide-react';

interface PlotSearchProps {
  plots: Plot[];
  selectedPlotId: string | null;
  onSelectPlot: (plot: Plot | null) => void;
}

export const PlotSearch: React.FC<PlotSearchProps> = ({
  plots,
  selectedPlotId,
  onSelectPlot,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedPlot = plots.find((p) => p.id === selectedPlotId);

  useEffect(() => {
    if (selectedPlot) {
      setSearchTerm(selectedPlot.plot_number);
    }
  }, [selectedPlotId]);

  const filteredPlots = searchTerm.trim()
    ? plots.filter((p) =>
        p.plot_number.toLowerCase().includes(searchTerm.toLowerCase().trim())
      )
    : [];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (plot: Plot) => {
    setSearchTerm(plot.plot_number);
    onSelectPlot(plot);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchTerm('');
    onSelectPlot(null);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative max-w-xs w-full">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 absolute left-3 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search plot number (e.g. A-27)..."
          className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xl transition-all"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-2.5 p-0.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Auto-complete Dropdown */}
      {isOpen && filteredPlots.length > 0 && (
        <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-800/60">
          {filteredPlots.map((plot) => {
            const isSel = plot.id === selectedPlotId;
            return (
              <button
                key={plot.id}
                onClick={() => handleSelect(plot)}
                className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left transition-colors text-xs ${
                  isSel ? 'bg-indigo-600/20 text-indigo-300 font-semibold' : 'hover:bg-slate-800/80 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{plot.plot_number}</span>
                  <span className="text-[10px] text-slate-400">({plot.area} sq.ft)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`capitalize font-semibold text-[10px] px-2 py-0.5 rounded-full ${
                      plot.status === 'available'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : plot.status === 'booked'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {plot.status}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {isOpen && searchTerm.trim() && filteredPlots.length === 0 && (
        <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 text-center shadow-2xl">
          No plot found matching &quot;{searchTerm}&quot;
        </div>
      )}
    </div>
  );
};

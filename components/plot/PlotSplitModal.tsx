'use client';

import React, { useState } from 'react';
import { Plot } from '@/types';
import { Grid, Sparkles, X, Layers, Hash, Check } from 'lucide-react';

interface PlotSplitModalProps {
  isOpen: boolean;
  plot: Plot | null;
  onClose: () => void;
  onSplit: (plotId: string, rows: number, cols: number, startNumber: number) => void;
}

export const PlotSplitModal: React.FC<PlotSplitModalProps> = ({
  isOpen,
  plot,
  onClose,
  onSplit,
}) => {
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(4);
  const [startNum, setStartNum] = useState(201);

  if (!isOpen || !plot) return null;

  const totalPlotsCreated = rows * cols;
  const approxPlotArea = Math.round((plot.area || 1440) / totalPlotsCreated);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSplit(plot.id, Math.max(1, rows), Math.max(1, cols), Math.max(1, startNum));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-6 text-white animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Subdivide Block into Small Plots</h3>
              <p className="text-xs text-slate-400">
                Splits target block (Plot {plot.plot_number}) into individual small plots
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Rows input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Rows</span>
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Cols input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Grid className="w-3.5 h-3.5 text-cyan-400" />
                <span>Columns</span>
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={cols}
                onChange={(e) => setCols(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Starting plot number */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-amber-400" />
              <span>Starting Plot Number</span>
            </label>
            <input
              type="number"
              min="1"
              value={startNum}
              onChange={(e) => setStartNum(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
              placeholder="e.g. 191 or 235"
            />
            <p className="text-[11px] text-slate-400">
              Generates Plots {startNum} to {startNum + totalPlotsCreated - 1}
            </p>
          </div>

          {/* Subdivision preview stats */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Plots Created:</span>
              <span className="font-bold text-indigo-400 font-mono">{totalPlotsCreated} Plots</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Approx. Small Plot Area:</span>
              <span className="font-bold text-emerald-400 font-mono">
                {approxPlotArea} sq.ft ({(approxPlotArea / 435.6).toFixed(2)} Cents)
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Small Plots</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

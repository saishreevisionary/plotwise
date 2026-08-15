'use client';

import React from 'react';
import { Loader2, Sparkles, CheckCircle2, Cpu, Grid, Layers } from 'lucide-react';

interface ProcessingStatusProps {
  currentStage: number; // 0 to 4
  error?: string;
  onRetry?: () => void;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  currentStage,
  error,
  onRetry,
}) => {
  const stages = [
    { title: 'Uploading Layout Document', desc: 'Encrypting and staging PDF/image file...', icon: Cpu },
    { title: 'AI Vision & OCR Analysis', desc: 'Running vision model over layout geometry...', icon: Sparkles },
    { title: 'Detecting Plot Boundaries', desc: 'Identifying plot numbers, polygons & roads...', icon: Grid },
    { title: 'Validating Normalized Coordinates', desc: 'Extruding 2D polygons to 3D geometry engine...', icon: Layers },
    { title: 'Digital Twin Ready', desc: 'Loading interactive 2D map & 3D site viewer...', icon: CheckCircle2 },
  ];

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">AI Analysis Needs Review</h3>
          <p className="text-xs text-rose-300 mt-1">{error}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
          >
            Retry Analysis or Manual Edit
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 max-w-lg w-full mx-auto space-y-6 shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 animate-pulse">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">AI Plot Intelligence Processing</h3>
          <p className="text-xs text-slate-400">Transforming layout into interactive 2D/3D map</p>
        </div>
      </div>

      <div className="space-y-4">
        {stages.map((st, idx) => {
          const Icon = st.icon;
          const isDone = idx < currentStage;
          const isCurrent = idx === currentStage;

          return (
            <div
              key={idx}
              className={`flex items-center gap-3.5 p-3 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-indigo-600/15 border-indigo-500/40 text-white'
                  : isDone
                  ? 'bg-slate-950/60 border-slate-800 text-slate-400'
                  : 'opacity-40 border-transparent text-slate-600'
              }`}
            >
              <div className="shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                ) : (
                  <Icon className="w-5 h-5 text-slate-600" />
                )}
              </div>

              <div>
                <span className="text-xs font-bold block">{st.title}</span>
                <span className="text-[11px] text-slate-400 block">{st.desc}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';

export const StatusLegend: React.FC = () => {
  return (
    <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-lg px-3.5 py-2 text-xs shadow-lg text-slate-300">
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-emerald-500 shadow-sm shadow-emerald-500/50" />
        <span className="font-medium">Available</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-amber-500 shadow-sm shadow-amber-500/50" />
        <span className="font-medium">Booked</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-rose-500 shadow-sm shadow-rose-500/50" />
        <span className="font-medium">Sold</span>
      </div>
      <div className="flex items-center gap-1.5 border-l border-slate-700 pl-3">
        <span className="w-3 h-3 rounded-sm border-2 border-cyan-400 bg-cyan-400/20" />
        <span className="font-medium text-cyan-300">Selected</span>
      </div>
    </div>
  );
};

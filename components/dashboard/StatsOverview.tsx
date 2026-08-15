'use client';

import React from 'react';
import { Project } from '@/types';
import { Grid, CheckCircle2, Clock, Ban, DollarSign, TrendingUp } from 'lucide-react';

interface StatsOverviewProps {
  projects: Project[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ projects }) => {
  const totalPlots = projects.reduce((sum, p) => sum + (p.total_plots || 0), 0);
  const availablePlots = projects.reduce((sum, p) => sum + (p.available_plots || 0), 0);
  const bookedPlots = projects.reduce((sum, p) => sum + (p.booked_plots || 0), 0);
  const soldPlots = projects.reduce((sum, p) => sum + (p.sold_plots || 0), 0);
  const totalVal = projects.reduce((sum, p) => sum + (p.total_value || 0), 0);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(1)} Lakh`;
    }
    return `₹${val.toLocaleString()}`;
  };

  const stats = [
    {
      label: 'Total Digital Plots',
      value: totalPlots,
      icon: Grid,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
      sub: `${projects.length} Site Projects`,
    },
    {
      label: 'Available Plots',
      value: availablePlots,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      sub: `${totalPlots ? Math.round((availablePlots / totalPlots) * 100) : 0}% of inventory`,
    },
    {
      label: 'Booked Plots',
      value: bookedPlots,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      sub: 'Token Advance Recd',
    },
    {
      label: 'Sold Plots',
      value: soldPlots,
      icon: Ban,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
      sub: 'Deed Registered',
    },
    {
      label: 'Portfolio Land Value',
      value: formatCurrency(totalVal),
      icon: TrendingUp,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      sub: 'Estimated Gross Value',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-xl border ${item.bg} bg-slate-900/60 backdrop-blur-md flex flex-col justify-between hover:border-slate-700 transition-all duration-200 shadow-md`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">{item.label}</span>
              <div className={`p-2 rounded-lg ${item.bg}`}>
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white tracking-tight">{item.value}</span>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{item.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

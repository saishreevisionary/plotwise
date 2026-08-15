'use client';

import React from 'react';
import Link from 'next/link';
import { Project } from '@/types';
import { MapPin, Layers, Box, ArrowRight, Sparkles, Calendar } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const isDemo = project.id === 'demo-project-green-valley';
  const total = project.total_plots || 0;
  const avail = project.available_plots || 0;
  const booked = project.booked_plots || 0;
  const sold = project.sold_plots || 0;

  const availPct = total > 0 ? (avail / total) * 100 : 0;
  const bookedPct = total > 0 ? (booked / total) * 100 : 0;
  const soldPct = total > 0 ? (sold / total) * 100 : 0;

  return (
    <div className="group rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-5 flex flex-col justify-between transition-all duration-300 shadow-xl hover:shadow-indigo-500/10">
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-medium flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate max-w-[180px]">{project.location}</span>
          </span>

          {isDemo && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Demo Township
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
          {project.name}
        </h3>

        <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
          {project.description}
        </p>

        {/* Progress Bar */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Inventory Breakdown ({total} Plots)</span>
            <span className="text-emerald-400 font-semibold">{avail} Available</span>
          </div>

          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
            <div style={{ width: `${availPct}%` }} className="bg-emerald-500 h-full transition-all" title={`Available: ${avail}`} />
            <div style={{ width: `${bookedPct}%` }} className="bg-amber-500 h-full transition-all" title={`Booked: ${booked}`} />
            <div style={{ width: `${soldPct}%` }} className="bg-rose-500 h-full transition-all" title={`Sold: ${sold}`} />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {avail} Avail
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {booked} Booked
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {sold} Sold
            </span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
        <div className="text-xs text-slate-400 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>

        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition-all duration-200"
        >
          <span>Open Site Map</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

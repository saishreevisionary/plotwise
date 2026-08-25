'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { LayoutUploader } from '@/components/upload/LayoutUploader';
import { AppState } from '@/lib/store/app-state';
import { Project, Layout, Plot } from '@/types';
import {
  MapPin,
  Layers,
  Box,
  Plus,
  UploadCloud,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Clock,
} from 'lucide-react';

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [showUploader, setShowUploader] = useState(false);

  const loadProjectData = () => {
    const proj = AppState.getProjectById(projectId);
    if (proj) {
      setProject({ ...proj });
      setLayouts(AppState.getLayoutsByProjectId(projectId));
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const handleDeleteLayout = (layoutId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      window.confirm(
        'Are you sure you want to delete this layout digital twin? All associated plots will be removed.'
      )
    ) {
      AppState.deleteLayout(layoutId);
      loadProjectData();
    }
  };

  const handleDeleteProject = () => {
    if (
      project &&
      window.confirm(
        `Are you sure you want to delete project "${project.name}" and all its layouts? This action cannot be undone.`
      )
    ) {
      AppState.deleteProject(projectId);
      router.push('/dashboard');
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-white">
        <p className="text-slate-400">Loading project details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Top Project Breadcrumbs & Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                <Link href="/dashboard" className="hover:text-white">
                  Dashboard
                </Link>
                <span>/</span>
                <span className="text-slate-200 font-semibold">{project.name}</span>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                {project.name}
              </h1>

              <p className="text-xs md:text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span>{project.location}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setShowUploader(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Layout / Aerial Survey</span>
              </button>

              {layouts.length > 0 && (
                <Link
                  href={`/projects/${project.id}/layout/${layouts[0].id}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all"
                >
                  <Box className="w-4 h-4" />
                  <span>Launch 2D/3D Map</span>
                </Link>
              )}

              <button
                onClick={handleDeleteProject}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all"
                title="Delete Project"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          </div>

          {/* Uploader View */}
          {showUploader && (
            <LayoutUploader
              projectId={project.id}
              onCompleted={(layoutId) => {
                setShowUploader(false);
                router.push(`/projects/${project.id}/layout/${layoutId}`);
              }}
              onCancel={() => setShowUploader(false)}
            />
          )}

          {/* Stats Breakdown Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-medium text-slate-400 block">Total Plots</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">
                {project.total_plots || 0}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
              <span className="text-xs font-medium text-emerald-400 block">Available</span>
              <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
                {project.available_plots || 0}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30">
              <span className="text-xs font-medium text-amber-400 block">Booked</span>
              <span className="text-2xl font-extrabold text-amber-400 mt-1 block">
                {project.booked_plots || 0}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30">
              <span className="text-xs font-medium text-rose-400 block">Sold</span>
              <span className="text-2xl font-extrabold text-rose-400 mt-1 block">
                {project.sold_plots || 0}
              </span>
            </div>
          </div>

          {/* Layout Blueprint Versions List */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Site Layout Digital Twins ({layouts.length})</span>
            </h2>

            {layouts.length === 0 ? (
              <div className="p-12 rounded-2xl bg-slate-900 border border-dashed border-slate-800 text-center space-y-4">
                <UploadCloud className="w-12 h-12 text-slate-600 mx-auto" />
                <div>
                  <h3 className="text-base font-bold text-white">No layout uploaded yet</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Upload your Drone Aerial Photo, Satellite survey or CAD Blueprint to derive 2D & 3D site geometry.
                  </p>
                </div>
                <button
                  onClick={() => setShowUploader(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                >
                  Upload First Layout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {layouts.map((layout) => {
                  const layoutPlots = AppState.getPlotsByLayoutId(layout.id);
                  return (
                    <div
                      key={layout.id}
                      className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          {layout.image_source_type === 'drone_aerial' || layout.ai_model?.includes('Drone') ? (
                            <span className="text-[11px] font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                              <span>🚁</span>
                              <span>Drone Aerial Twin</span>
                            </span>
                          ) : layout.aerial_image_url || layout.image_source_type === 'satellite' ? (
                            <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                              <span>🛰️</span>
                              <span>Dual-Layer Overlay Twin</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                              <span>📐</span>
                              <span>CAD Blueprint Twin</span>
                            </span>
                          )}

                          {layout.processing_status === 'completed' ? (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Verified
                            </span>
                          ) : layout.processing_status === 'needs_review' ? (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              Needs Review
                            </span>
                          ) : (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-indigo-400" />
                              Processing
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-white">
                            Layout Digital Twin #{layout.id.slice(-6)}
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Canvas Resolution: {layout.original_width} x {layout.original_height}px
                          </p>
                        </div>

                        <div className="text-xs text-slate-300 font-semibold">
                          Detected Plots: <span className="text-indigo-400">{layoutPlots.length}</span>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500">
                          Uploaded {new Date(layout.created_at).toLocaleDateString()}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleDeleteLayout(layout.id, e)}
                            title="Delete Layout"
                            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 border border-transparent hover:border-rose-500/30 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <Link
                            href={`/projects/${project.id}/layout/${layout.id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
                          >
                            <span>Open Interactive 2D/3D Map</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

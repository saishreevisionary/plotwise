'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { CreateProjectModal } from '@/components/project/CreateProjectModal';
import { AppState } from '@/lib/store/app-state';
import { Project } from '@/types';
import { Building2, Plus, RotateCcw, Sparkles } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(() => AppState.getProjects());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadProjects = () => {
    setProjects(AppState.getProjects());
  };

  useEffect(() => {
    const sync = async () => {
      await AppState.syncFromSupabase();
      loadProjects();
    };
    sync();
  }, []);

  const handleCreateProject = (data: { name: string; location: string; description: string }) => {
    AppState.createProject(data);
    loadProjects();
  };

  const handleResetDemoData = () => {
    const updated = AppState.resetDemoData();
    setProjects(updated);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header onOpenCreateProject={() => setIsModalOpen(true)} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <Building2 className="w-6 h-6 text-indigo-400" />
                <span>Real Estate Site Projects</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">Manage township site layouts, plot inventories and 3D digital twins</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleResetDemoData}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition-all"
                title="Restore default demo township projects"
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                <span>Restore Demo Data</span>
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Project</span>
              </button>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="p-12 rounded-3xl bg-slate-900/60 border border-dashed border-slate-800 text-center space-y-4 max-w-xl mx-auto my-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">No Projects Found</h3>
                <p className="text-xs text-slate-400">
                  You don&apos;t have any active real estate projects in your store.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={handleResetDemoData}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 hover:scale-[1.02] transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Restore Demo Township Projects</span>
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold hover:bg-slate-800 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Project</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((proj) => (
                <ProjectCard key={proj.id} project={proj} />
              ))}
            </div>
          )}
        </main>
      </div>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}

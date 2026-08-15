'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { CreateProjectModal } from '@/components/project/CreateProjectModal';
import { RoleDashboard } from '@/components/dashboard/RoleDashboard';
import { AuthStore } from '@/lib/store/auth-store';
import { AppState } from '@/lib/store/app-state';
import { Project, UserProfile } from '@/types';
import { Sparkles, Plus, ArrowRight, Building2, Layers } from 'lucide-react';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(AuthStore.getCurrentUser());

  const loadProjects = () => {
    setProjects(AppState.getProjects());
    setCurrentUser(AuthStore.getCurrentUser());
  };

  useEffect(() => {
    setIsMounted(true);
    loadProjects();
  }, []);

  const handleCreateProject = (data: { name: string; location: string; description: string }) => {
    AppState.createProject(data);
    loadProjects();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header onOpenCreateProject={() => setIsModalOpen(true)} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Role-Tailored Interactive Dashboard */}
          <RoleDashboard currentUser={currentUser} onOpenCreateProject={() => setIsModalOpen(true)} />

          {/* Portfolio Metrics */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Portfolio Overview
            </h2>
            <StatsOverview projects={projects} />
          </div>

          {/* Projects List Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <span>Active Real Estate Projects ({projects.length})</span>
              </h2>

              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Project</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((proj) => (
                <ProjectCard key={proj.id} project={proj} />
              ))}
            </div>
          </div>
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

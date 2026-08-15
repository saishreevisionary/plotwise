import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Layers, Box, Plus, Search, Building2, ShieldCheck, UserCheck, Key, ChevronDown, LogOut } from 'lucide-react';
import { AuthStore } from '@/lib/store/auth-store';
import { UserRole, UserProfile } from '@/types';

interface HeaderProps {
  onOpenCreateProject?: () => void;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  onRoleChanged?: (role: UserRole) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreateProject,
  searchTerm = '',
  onSearchChange,
  onRoleChanged,
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(AuthStore.getCurrentUser());
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    setCurrentUser(AuthStore.getCurrentUser());
  }, []);

  const handleSelectRole = (role: UserRole) => {
    const updated = AuthStore.switchRole(role);
    setCurrentUser(updated);
    setShowRoleMenu(false);
    if (onRoleChanged) onRoleChanged(role);
    if (typeof window !== 'undefined') window.location.reload();
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between shadow-md">
      {/* Brand Logo & Title */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
            <Box className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
                PLOTWISE
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold tracking-wider uppercase">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              Static Layouts to Intelligent 3D Land
            </p>
          </div>
        </Link>
      </div>

      {/* Global Quick Search (if handler provided) */}
      {onSearchChange !== undefined && (
        <div className="hidden md:flex items-center relative max-w-sm w-full mx-4">
          <Search className="w-4 h-4 absolute left-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search plot number (e.g. A-27)..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
      )}

      {/* Right Actions & Multi-Role Switcher */}
      <div className="flex items-center gap-3">
        {onOpenCreateProject && currentUser.role === 'admin' && (
          <button
            onClick={onOpenCreateProject}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/30 hover:shadow-indigo-500/50 transition-all duration-200 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">New Project</span>
          </button>
        )}

        <div className="h-6 w-px bg-slate-800 hidden sm:block" />

        {/* Logged-In User Profile Card & Logout */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs shadow-md ${
            currentUser.role === 'admin'
              ? 'bg-slate-900 border-slate-700 text-white'
              : currentUser.role === 'broker'
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
          }`}>
            {currentUser.role === 'admin' && <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />}
            {currentUser.role === 'broker' && <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />}
            {currentUser.role === 'client' && <Key className="w-4 h-4 text-cyan-400 shrink-0" />}

            <div className="text-left hidden sm:block">
              <span className="font-bold block leading-tight">
                {currentUser.role === 'admin' && 'Developer Admin'}
                {currentUser.role === 'broker' && `Broker (${currentUser.broker_code || 'BRK'})`}
                {currentUser.role === 'client' && 'Client Buyer'}
              </span>
              <span className="text-[10px] opacity-75 block truncate max-w-[130px]">
                {currentUser.name}
              </span>
            </div>
          </div>

          <button
            onClick={() => AuthStore.logout()}
            className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-800 transition-all"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

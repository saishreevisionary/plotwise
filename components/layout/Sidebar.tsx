import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, Sparkles, Settings, LogOut, Box, Key, Users, Calculator, ShieldCheck } from 'lucide-react';
import { AuthStore } from '@/lib/store/auth-store';
import { UserProfile } from '@/types';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<UserProfile>(AuthStore.getCurrentUser());

  useEffect(() => {
    setCurrentUser(AuthStore.getCurrentUser());
  }, []);

  const getNavItems = () => {
    if (currentUser.role === 'broker') {
      return [
        { label: 'Broker Hub', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Assigned Layouts', href: '/projects', icon: FolderKanban },
      ];
    } else if (currentUser.role === 'client') {
      return [
        { label: 'Buyer Portal', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Featured Sites', href: '/projects', icon: FolderKanban },
      ];
    }

    return [
      { label: 'Master Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'All Projects', href: '/projects', icon: FolderKanban },
    ];
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between hidden md:flex shrink-0">
      {/* Upper Navigation */}
      <div className="p-4 space-y-6">
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            {currentUser.role === 'admin' && 'Developer Admin Workspace'}
            {currentUser.role === 'broker' && 'Broker Portal Navigation'}
            {currentUser.role === 'client' && 'Client 3D Portal'}
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Dynamic Role Capability Card */}
        {currentUser.role === 'broker' && (
          <div className="p-3.5 rounded-xl bg-gradient-to-b from-amber-950/30 to-slate-900 border border-amber-500/20 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Broker Code Active</span>
            </div>
            <p className="text-amber-200/80 font-mono font-bold text-sm">
              {currentUser.broker_code || 'BRK-VIP-909'}
            </p>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Share your referral code or direct link to attribute client leads & token advances directly to your commission account.
            </p>
          </div>
        )}

        {currentUser.role === 'client' && (
          (() => {
            const broker = AuthStore.getAssignedBrokerForClient(currentUser);
            const bName = broker ? broker.name : 'Priyanka';
            const bAgency = broker ? (broker.agency_name || 'priyanka brokers') : 'priyanka brokers';
            const bPhone = broker ? (broker.phone || '7531594560') : '7531594560';

            return (
              <div className="p-3.5 rounded-xl bg-gradient-to-b from-cyan-950/30 to-slate-900 border border-cyan-500/20 text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Assigned Broker</span>
                </div>
                <p className="text-white font-bold text-xs">{bName}</p>
                <p className="text-slate-400 text-[11px]">{bAgency} ({bPhone})</p>
              </div>
            );
          })()
        )}

        {currentUser.role === 'admin' && (
          <div className="p-3.5 rounded-xl bg-gradient-to-b from-slate-900 to-indigo-950/40 border border-indigo-500/20 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>AI Digital Twin Engine</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Upload static blueprint layout files (PDF/JPG/PNG) to instantly derive 2D & 3D site geometry.
            </p>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="p-4 border-t border-slate-900 space-y-1">
        <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all">
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Settings</span>
        </button>
        <button
          onClick={() => AuthStore.logout()}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

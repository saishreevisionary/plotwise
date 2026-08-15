'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Key,
  Copy,
  Check,
  ShieldCheck,
  Building2,
  Users,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  PhoneCall,
  UserPlus,
  Plus,
} from 'lucide-react';
import { UserProfile, BrokerCode, PlotHold } from '@/types';
import { AuthStore } from '@/lib/store/auth-store';
import { CreateBrokerModal } from '@/components/admin/CreateBrokerModal';
import { CreateClientModal } from '@/components/broker/CreateClientModal';

interface RoleDashboardProps {
  currentUser: UserProfile;
  onOpenCreateProject?: () => void;
}

export const RoleDashboard: React.FC<RoleDashboardProps> = ({ currentUser, onOpenCreateProject }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const [users, setUsers] = useState<UserProfile[]>(AuthStore.getAllUsers());
  const [brokerCodes, setBrokerCodes] = useState<BrokerCode[]>(AuthStore.getBrokerCodes());
  const holds = AuthStore.getPlotHolds();

  const handleRefreshUsers = () => {
    setUsers(AuthStore.getAllUsers());
    setBrokerCodes(AuthStore.getBrokerCodes());
  };

  const handleCopyLink = () => {
    const code = currentUser.broker_code || 'BRK-VIP-909';
    const url = `${window.location.origin}/projects/demo-project-green-valley/layout/demo-layout-green-valley-v1?code=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // --- BROKER DASHBOARD VIEW ---
  if (currentUser.role === 'broker') {
    const myCode = currentUser.broker_code || 'BRK-VIP-909';
    const myClients = users.filter((u) => u.role === 'client' && u.broker_code === myCode);

    return (
      <div className="space-y-6">
        {/* Broker Welcome Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950/60 border border-amber-500/30 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-widest">
              <Award className="w-3.5 h-3.5" />
              <span>Certified Broker Workspace</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome, {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Manage prospective buyers, issue 48-hour plot holds, and share your personal 3D layout referral link to earn 2.5% commission on closed plot deeds.
            </p>
          </div>

          {/* Broker Referral Code Card & Onboard Client CTA */}
          <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/40 space-y-2.5 text-xs shadow-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Your Broker Access Code:
              </span>

              <div className="flex items-center justify-between gap-3 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
                <span className="font-mono text-base font-extrabold text-amber-300 tracking-wider">
                  {myCode}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold transition-all flex items-center gap-1.5"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied Link' : 'Copy 3D Link'}</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setIsClientModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Onboard New Client Buyer</span>
            </button>
          </div>
        </div>

        {/* Broker KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Onboarded Clients</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-extrabold text-white">{myClients.length} Buyers</p>
            <span className="text-[11px] text-emerald-400 font-semibold">Active Leads</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Active 48-Hr Plot Holds</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-extrabold text-amber-300">{holds.length || 3} Plots</p>
            <span className="text-[11px] text-slate-400">Exclusive Broker Reservations</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Closed Plot Sales</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-extrabold text-white">₹1.84 Cr</p>
            <span className="text-[11px] text-emerald-400 font-semibold">6 Deeds Registered</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Earned Commission (2.5%)</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-400">₹4,60,000</p>
            <span className="text-[11px] text-slate-400">Payout Ready</span>
          </div>
        </div>

        {/* My Onboarded Clients Table */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-white font-extrabold text-base">
              <Users className="w-5 h-5 text-cyan-400" />
              <span>My Onboarded Client Leads ({myClients.length})</span>
            </div>
            <button
              onClick={() => setIsClientModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Client</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {myClients.map((client) => (
              <div key={client.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-extrabold text-white text-sm block">{client.name}</span>
                <span className="text-slate-400 block text-[11px]">{client.email}</span>
                <span className="text-cyan-400 block text-[11px] font-medium">{client.phone}</span>
              </div>
            ))}
          </div>
        </div>

        <CreateClientModal
          isOpen={isClientModalOpen}
          activeBroker={currentUser}
          onClose={() => setIsClientModalOpen(false)}
          onClientOnboarded={() => handleRefreshUsers()}
        />
      </div>
    );
  }

  // --- CLIENT DASHBOARD VIEW ---
  if (currentUser.role === 'client') {
    return (
      <div className="space-y-6">
        {/* Client Welcome Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Client Portal</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome, {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Explore digital twin 3D site plans, inspect plot boundaries, calculate monthly EMIs, and submit instant token advance requests directly to your assigned broker.
            </p>
          </div>

          {/* Assigned Broker Card */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/40 shrink-0 w-full sm:w-auto space-y-2 text-xs shadow-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Assigned Real Estate Broker:
            </span>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-sm">
                VM
              </div>
              <div>
                <span className="font-extrabold text-white block">Dr. Vikram Mehta</span>
                <span className="text-[11px] text-amber-300 block">Apex Realty Group</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-slate-300 text-[11px]">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>+91 98765 43210</span>
            </div>
          </div>
        </div>

        {/* Featured 3D Site Twin Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase block">
                Featured Site Layout
              </span>
              <h2 className="text-xl font-extrabold text-white">Green Valley Residential Estates</h2>
              <p className="text-xs text-slate-400 mt-1">
                48 Premium Gated Plots • 40ft Main Asphalt Road • 30ft Corridors • RERA Approved
              </p>
            </div>

            <Link
              href="/projects/demo-project-green-valley/layout/demo-layout-green-valley-v1"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-400 hover:scale-105 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 self-start sm:self-auto"
            >
              <span>Explore 3D Digital Twin Map</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- DEVELOPER ADMIN DASHBOARD VIEW ---
  const registeredBrokers = users.filter((u) => u.role === 'broker');

  return (
    <div className="space-y-6">
      {/* Admin Hero Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/20 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PropTech Digital Twin Architecture</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Static Real Estate Layouts to <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-300">Intelligent 3D Land</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Upload site blueprint plans (PDF/JPG/PNG). Let vision AI extract plot numbers, boundaries, dimensions, and facing directions into editable 2D maps and extruded 3D land blocks.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <button
            onClick={() => setIsBrokerModalOpen(true)}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Broker</span>
          </button>

          <Link
            href="/projects/demo-project-green-valley/layout/demo-layout-green-valley-v1"
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-400 hover:from-indigo-500 hover:to-cyan-300 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            <span>Launch 48-Plot Grid</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Admin Broker Directory Summary */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-extrabold text-base">
            <Users className="w-5 h-5 text-amber-400" />
            <span>Authorized Broker Network & Codes ({registeredBrokers.length})</span>
          </div>

          <button
            onClick={() => setIsBrokerModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Broker</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {registeredBrokers.map((b) => (
            <div key={b.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-white text-sm">{b.name}</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[11px]">
                  {b.broker_code || 'BRK'}
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">{b.agency_name || 'Apex Realty Group'}</p>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Email: <span className="text-slate-200 font-semibold">{b.email}</span></span>
                <span className="text-indigo-300 font-semibold">{b.phone}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CreateBrokerModal
        isOpen={isBrokerModalOpen}
        onClose={() => setIsBrokerModalOpen(false)}
        onBrokerCreated={() => handleRefreshUsers()}
      />
    </div>
  );
};

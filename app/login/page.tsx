'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Lock, Mail, Sparkles, ArrowRight, ShieldCheck, Key, UserCheck, Phone, Building2 } from 'lucide-react';
import { AuthStore } from '@/lib/store/auth-store';
import { UserRole } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const [activeRoleTab, setActiveRoleTab] = useState<UserRole>('admin');

  useEffect(() => {
    AuthStore.syncFromSupabase();
  }, []);

  // Admin form state
  const [adminEmail, setAdminEmail] = useState('admin@plotwise.com');
  const [adminPassword, setAdminPassword] = useState('admin123');

  // Broker form state
  const [brokerEmail, setBrokerEmail] = useState('');
  const [brokerPassword, setBrokerPassword] = useState('password123');
  const [brokerCodeInput, setBrokerCodeInput] = useState('');

  // Client form state
  const [clientEmail, setClientEmail] = useState('');
  const [clientPassword, setClientPassword] = useState('password123');
  const [clientBrokerCode, setClientBrokerCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      const res = AuthStore.authenticateUser(adminEmail, adminPassword, 'admin');
      if (res.success) {
        router.push('/dashboard');
      } else {
        setErrorMsg(res.message || 'Invalid Developer Admin credentials.');
        setLoading(false);
      }
    }, 400);
  };

  const handleBrokerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      const cleanEmail = brokerEmail.trim().toLowerCase();
      const cleanCode = brokerCodeInput.trim().toUpperCase();

      const users = AuthStore.getAllUsers();
      
      // 1. Find registered broker account by email (or by code if email is empty)
      let brokerUser = users.find(
        (u) => u.role === 'broker' && cleanEmail !== '' && u.email.trim().toLowerCase() === cleanEmail
      );

      if (!brokerUser && cleanCode) {
        brokerUser = users.find(
          (u) => u.role === 'broker' && u.broker_code?.toUpperCase() === cleanCode
        );
      }

      if (!brokerUser) {
        setErrorMsg('Broker account not found. Please check your Email or Username.');
        setLoading(false);
        return;
      }

      // 2. Strict Access Code Check: If a code is entered, it MUST match the registered broker's code!
      if (cleanCode && brokerUser.broker_code?.toUpperCase() !== cleanCode) {
        setErrorMsg(`Invalid Broker Access Code. The code '${cleanCode}' does not match this broker account.`);
        setLoading(false);
        return;
      }

      // 3. Password Verification
      if (brokerPassword && brokerUser.password && brokerUser.password !== brokerPassword.trim()) {
        setErrorMsg('Invalid broker password. Please enter the correct password.');
        setLoading(false);
        return;
      }

      AuthStore.setCurrentUser(brokerUser);
      router.push('/dashboard');
    }, 400);
  };

  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      const cleanCode = clientBrokerCode.trim().toUpperCase();
      const validBroker = AuthStore.validateBrokerCode(cleanCode);

      if (!validBroker) {
        setErrorMsg('Invalid Broker Access Code. Access Denied.');
        setLoading(false);
        return;
      }

      const res = AuthStore.authenticateClient({
        email: clientEmail,
        password: clientPassword,
        broker_code: cleanCode,
      });

      if (res.success) {
        router.push('/dashboard');
      } else {
        setErrorMsg(res.message || 'Invalid Client Credentials.');
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30">
            <Box className="w-6 h-6 text-white stroke-[2.5]" />
          </div>

          <h1 className="text-2xl font-extrabold text-white tracking-tight">PLOTWISE AI</h1>
          <p className="text-xs text-slate-400">Unified Multi-Role Real Estate Digital Twin Platform</p>
        </div>

        {/* Role Tab Selector */}
        <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 grid grid-cols-3 gap-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveRoleTab('admin');
              setErrorMsg(null);
            }}
            className={`py-2 px-1 rounded-xl font-bold transition-all flex items-center justify-center gap-1 ${
              activeRoleTab === 'admin'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveRoleTab('broker');
              setErrorMsg(null);
            }}
            className={`py-2 px-1 rounded-xl font-bold transition-all flex items-center justify-center gap-1 ${
              activeRoleTab === 'broker'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Broker</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveRoleTab('client');
              setErrorMsg(null);
            }}
            className={`py-2 px-1 rounded-xl font-bold transition-all flex items-center justify-center gap-1 ${
              activeRoleTab === 'client'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Client</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* 1. DEVELOPER ADMIN FORM */}
        {activeRoleTab === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Developer Admin Email</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 absolute left-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@plotwise.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Password</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In as Developer Admin'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* 2. REAL ESTATE BROKER FORM */}
        {activeRoleTab === 'broker' && (
          <form onSubmit={handleBrokerSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Broker Email / Agency Name</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 absolute left-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={brokerEmail}
                  onChange={(e) => setBrokerEmail(e.target.value)}
                  placeholder="broker@realty.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Broker Access Code</label>
              <div className="relative flex items-center">
                <Key className="w-4 h-4 absolute left-3 text-amber-400" />
                <input
                  type="text"
                  required
                  value={brokerCodeInput}
                  onChange={(e) => setBrokerCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. BRK-VIP-909"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-mono font-bold placeholder:text-slate-500 focus:border-amber-500 focus:outline-none uppercase"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In as Broker'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* 3. END CLIENT / BUYER FORM */}
        {activeRoleTab === 'client' && (
          <form onSubmit={handleClientSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Client Email Address</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 absolute left-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="sri@plotwise.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Password</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={clientPassword}
                  onChange={(e) => setClientPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Assigned Broker Access Code</label>
              <div className="relative flex items-center">
                <Key className="w-4 h-4 absolute left-3 text-cyan-400" />
                <input
                  type="text"
                  required
                  value={clientBrokerCode}
                  onChange={(e) => setClientBrokerCode(e.target.value.toUpperCase())}
                  placeholder="e.g. 123"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono font-bold placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none uppercase"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating Client...' : 'Sign In as Client Buyer'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

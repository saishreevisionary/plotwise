'use client';

import React, { useState } from 'react';
import { ShieldCheck, Key, ArrowRight, AlertCircle, Sparkles, Building2, UserCheck } from 'lucide-react';
import { AuthStore } from '@/lib/store/auth-store';
import { BrokerCode } from '@/types';

interface ClientBrokerCodeGateProps {
  isOpen: boolean;
  onVerified: (broker: BrokerCode) => void;
  onClose?: () => void;
}

export const ClientBrokerCodeGate: React.FC<ClientBrokerCodeGateProps> = ({
  isOpen,
  onVerified,
  onClose,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setVerifying(true);

    setTimeout(() => {
      const res = AuthStore.verifyClientWithBrokerCode(code);
      if (res.success && res.broker) {
        onVerified(res.broker);
      } else {
        setError(res.message || 'Invalid Broker Access Code.');
      }
      setVerifying(false);
    }, 400);
  };

  const handleQuickTestCode = (testCode: string) => {
    setCode(testCode);
    setError(null);
    setVerifying(true);

    setTimeout(() => {
      const res = AuthStore.verifyClientWithBrokerCode(testCode);
      if (res.success && res.broker) {
        onVerified(res.broker);
      } else {
        setError(res.message || 'Invalid Broker Access Code.');
      }
      setVerifying(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-3xl rounded-full pointer-events-none" />

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
            <Key className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Broker Code Verification Required
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Client portal access is protected. Please enter your authorized Real Estate Broker Access Code to view live 3D site twins & plot inventory.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Verification Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              Enter Broker Access Code
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. BRK-VIP-909"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm uppercase tracking-wider placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none transition-all text-center font-bold"
            />
          </div>

          <button
            type="submit"
            disabled={verifying || !code.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>{verifying ? 'Verifying Code...' : 'Unlock 3D Digital Twin'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Registered Broker Codes List */}
        {(() => {
          const activeCodes = AuthStore.getBrokerCodes();
          if (activeCodes.length === 0) return null;
          return (
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 block text-center uppercase tracking-wider">
                Registered Broker Access Codes:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeCodes.map((bc) => (
                  <button
                    key={bc.code}
                    type="button"
                    onClick={() => handleQuickTestCode(bc.code)}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-all group"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 group-hover:text-amber-200">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{bc.code}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{bc.broker_name} ({bc.agency_name})</p>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

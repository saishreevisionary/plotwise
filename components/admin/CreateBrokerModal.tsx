'use client';

import React, { useState } from 'react';
import { X, Sparkles, User, Mail, Building2, Phone, Percent, Key, CheckCircle2 } from 'lucide-react';
import { AuthStore } from '@/lib/store/auth-store';
import { UserProfile } from '@/types';

interface CreateBrokerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBrokerCreated: (broker: UserProfile) => void;
}

export const CreateBrokerModal: React.FC<CreateBrokerModalProps> = ({
  isOpen,
  onClose,
  onBrokerCreated,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [phone, setPhone] = useState('');
  const [commissionRate, setCommissionRate] = useState('2.5');
  const [brokerCode, setBrokerCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successBroker, setSuccessBroker] = useState<UserProfile | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      const broker = AuthStore.registerBroker({
        name,
        email,
        agency_name: agencyName,
        phone,
        commission_rate: parseFloat(commissionRate) || 2.5,
        broker_code: brokerCode,
      });

      setSuccessBroker(broker);
      setSubmitting(false);

      setTimeout(() => {
        onBrokerCreated(broker);
        onClose();
        setSuccessBroker(null);
        setName('');
        setEmail('');
        setAgencyName('');
        setPhone('');
        setBrokerCode('');
      }, 1500);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">Register New Real Estate Broker Account</h2>
            <p className="text-xs text-slate-400">Issue authorized broker credentials & referral codes</p>
          </div>
        </div>

        {successBroker ? (
          <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs space-y-2 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="font-extrabold text-sm text-white">Broker Account Created!</h3>
            <p className="text-slate-300">
              Broker <span className="font-bold text-amber-300">{successBroker.name}</span> has been assigned Access Code{' '}
              <span className="font-mono font-bold text-amber-400">{successBroker.broker_code}</span>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Broker Full Name</label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 absolute left-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Vikram Mehta"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Agency / Company Name</label>
                <div className="relative flex items-center">
                  <Building2 className="w-4 h-4 absolute left-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="Apex Realty Group"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="broker@realty.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Phone Number</label>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 absolute left-3 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Commission Rate (%)</label>
                <div className="relative flex items-center">
                  <Percent className="w-4 h-4 absolute left-3 text-slate-400" />
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    placeholder="2.5"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Broker Access Code (Optional)</label>
                <div className="relative flex items-center">
                  <Key className="w-4 h-4 absolute left-3 text-amber-400" />
                  <input
                    type="text"
                    value={brokerCode}
                    onChange={(e) => setBrokerCode(e.target.value.toUpperCase())}
                    placeholder="Auto-generated if empty"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-mono font-bold uppercase placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{submitting ? 'Creating Broker Account...' : 'Confirm Broker Registration'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

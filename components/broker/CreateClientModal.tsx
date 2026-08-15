'use client';

import React, { useState } from 'react';
import { X, UserPlus, User, Mail, Phone, Key, CheckCircle2, Lock } from 'lucide-react';
import { AuthStore } from '@/lib/store/auth-store';
import { UserProfile } from '@/types';

interface CreateClientModalProps {
  isOpen: boolean;
  activeBroker: UserProfile;
  onClose: () => void;
  onClientOnboarded: (client: UserProfile) => void;
}

export const CreateClientModal: React.FC<CreateClientModalProps> = ({
  isOpen,
  activeBroker,
  onClose,
  onClientOnboarded,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('password123');
  const [submitting, setSubmitting] = useState(false);
  const [successClient, setSuccessClient] = useState<UserProfile | null>(null);

  if (!isOpen) return null;

  const brokerCode = activeBroker.broker_code || 'BRK-VIP-909';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      const client = AuthStore.registerClient({
        name,
        email,
        phone,
        password,
        broker_code: brokerCode,
        broker_id: activeBroker.id,
      });

      setSuccessClient(client);
      setSubmitting(false);

      setTimeout(() => {
        onClientOnboarded(client);
        onClose();
        setSuccessClient(null);
        setName('');
        setEmail('');
        setPhone('');
        setPassword('password123');
      }, 1500);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">Onboard New Client Buyer</h2>
            <p className="text-xs text-slate-400">Register prospective buyer & issue 3D twin portal access</p>
          </div>
        </div>

        {successClient ? (
          <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs space-y-2 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="font-extrabold text-sm text-white">Client Onboarded Successfully!</h3>
            <p className="text-slate-300">
              <span className="font-bold text-cyan-300">{successClient.name}</span> has been linked to your Broker Code{' '}
              <span className="font-mono font-bold text-amber-400">{brokerCode}</span>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Client / Buyer Full Name</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 absolute left-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mr. Rajesh Sharma"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 absolute left-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@gmail.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Client Login Password</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="e.g. password123"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Contact Phone Number</label>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 absolute left-3 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98123 45678"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Your Broker Access Code (Attributed)</label>
              <div className="relative flex items-center">
                <Key className="w-4 h-4 absolute left-3 text-amber-400" />
                <input
                  type="text"
                  disabled
                  value={brokerCode}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-mono font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{submitting ? 'Registering Client...' : 'Onboard Client & Send 3D Portal Code'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { X, Clock, ShieldCheck, User, Phone, CheckCircle2, AlertCircle, Building2, Sparkles } from 'lucide-react';
import { Plot, UserProfile } from '@/types';
import { AuthStore } from '@/lib/store/auth-store';
import { AppState } from '@/lib/store/app-state';

interface PlotReservationModalProps {
  isOpen: boolean;
  plot: Plot | null;
  currentUser: UserProfile;
  onClose: () => void;
  onSuccess: () => void;
}

export const PlotReservationModal: React.FC<PlotReservationModalProps> = ({
  isOpen,
  plot,
  currentUser,
  onClose,
  onSuccess,
}) => {
  const [clientName, setClientName] = useState(currentUser.name || '');
  const [clientPhone, setClientPhone] = useState(currentUser.phone || '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !plot) return null;

  const isBroker = currentUser.role === 'broker';
  const isClient = currentUser.role === 'client';

  const handleHoldPlot = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      if (isBroker) {
        AuthStore.createPlotHold({
          plot_id: plot.id,
          broker_id: currentUser.id,
          broker_name: currentUser.name,
          client_name: clientName,
          client_phone: clientPhone,
          durationHours: 48,
        });

        AppState.updatePlotStatus(
          plot.id,
          'booked',
          currentUser.name,
          `48-Hour Broker Hold placed by ${currentUser.name} for ${clientName}`,
          clientName,
          clientPhone
        );

        setSuccessMsg(`Success! Plot ${plot.plot_number} has been reserved under a 48-Hour Broker Hold for ${clientName}.`);
      } else {
        AppState.updatePlotStatus(
          plot.id,
          'booked',
          'Client Booking Portal',
          `Token advance enquiry submitted by client ${clientName} (${clientPhone})`,
          clientName,
          clientPhone
        );

        setSuccessMsg(`Booking request received! Your assigned broker will contact you shortly at ${clientPhone}.`);
      }

      setSubmitting(false);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccessMsg(null);
      }, 1500);
    }, 500);
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
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">
              {isBroker ? `Place 48-Hour Hold on Plot ${plot.plot_number}` : `Reserve Plot ${plot.plot_number}`}
            </h2>
            <p className="text-xs text-slate-400">
              {isBroker ? 'Reserve inventory exclusively for your client' : 'Submit token booking request to your agent'}
            </p>
          </div>
        </div>

        {/* Plot Details Card */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-indigo-300 block text-sm">Plot {plot.plot_number}</span>
            <span className="text-slate-400">{plot.area} sq.ft ({plot.facing} Facing)</span>
          </div>
          <div className="text-right">
            <span className="font-extrabold text-emerald-400 block text-sm">
              ₹{(plot.price / 100000).toFixed(2)} Lakhs
            </span>
            <span className="text-[10px] text-slate-500">₹{(plot.price / plot.area).toFixed(0)} / sq.ft</span>
          </div>
        </div>

        {successMsg ? (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <p className="leading-relaxed font-semibold">{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleHoldPlot} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Client / Buyer Full Name</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 absolute left-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Mr. Rajesh Sharma"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
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
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Processing Hold...'
                  : isBroker
                  ? 'Confirm 48-Hour Broker Hold'
                  : 'Submit Plot Reservation Request'}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

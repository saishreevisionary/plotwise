'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Key, CreditCard, Sparkles } from 'lucide-react';
import { Plot, UserProfile } from '@/types';
import confetti from 'canvas-confetti';

interface ClientPlotBookingModalProps {
  isOpen: boolean;
  plot: Plot | null;
  activeClient: UserProfile;
  assignedBroker?: UserProfile | null;
  onClose: () => void;
  onConfirmBooking: (data: {
    customerName: string;
    customerPhone: string;
    tokenAmount: number;
    paymentRef: string;
    notes?: string;
  }) => void;
}

export const ClientPlotBookingModal: React.FC<ClientPlotBookingModalProps> = ({
  isOpen,
  plot,
  activeClient,
  assignedBroker,
  onClose,
  onConfirmBooking,
}) => {
  const [tokenAmount, setTokenAmount] = useState<number>(25000);
  const [paymentMode, setPaymentMode] = useState<string>('UPI Transfer');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen || !plot) return null;

  const brokerName = assignedBroker ? assignedBroker.name : 'Priyanka';
  const brokerCode = activeClient.broker_code || '123';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      onConfirmBooking({
        customerName: activeClient.name,
        customerPhone: activeClient.phone || '+91 98765 43210',
        tokenAmount,
        paymentRef: `${paymentMode.toUpperCase().slice(0, 3)}-${Math.floor(100000 + Math.random() * 900000)}`,
        notes: notes || `Direct Token Booking submitted by client ${activeClient.email} via Broker ${brokerName} (Code: ${brokerCode})`,
      });

      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });

      setSubmitting(false);
      onClose();
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

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">Book Plot {plot.plot_number} (Token Advance)</h2>
            <p className="text-xs text-slate-400">Issue instant 48-hour priority hold for your plot</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Pre-filled Client Profile Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Your Verified Client Credentials:
            </span>
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-extrabold text-white block">{activeClient.name}</span>
                <span className="text-slate-400 text-[11px] block">{activeClient.email}</span>
              </div>
              <span className="text-cyan-400 font-mono font-bold">{activeClient.phone || '+91 98765 43210'}</span>
            </div>
          </div>

          {/* Attributed Broker Info */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <div>
                <span className="font-bold text-amber-300 block">Attributed Broker: {brokerName}</span>
                <span className="text-[11px] text-slate-300">Broker Referral Access Code: {brokerCode}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Token Advance (₹)</label>
              <input
                type="number"
                required
                value={tokenAmount}
                onChange={(e) => setTokenAmount(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Payment Method</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:border-cyan-500 focus:outline-none"
              >
                <option value="UPI Transfer">UPI / GPay / PhonePe</option>
                <option value="NetBanking">Net Banking (IMPS/NEFT)</option>
                <option value="Cheque">Cheque Deposit</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">Booking Notes / Remarks</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Requesting site visit appointment this Saturday..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-indigo-600 hover:scale-[1.02] text-white text-xs font-extrabold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? 'Processing Token Hold...' : 'Confirm Plot Reservation & Pay Token'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

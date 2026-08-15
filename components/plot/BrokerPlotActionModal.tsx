'use client';

import React, { useState, useEffect } from 'react';
import { X, UserCheck, ShieldCheck, FileCheck, DollarSign, Calendar, Lock, Key, CreditCard } from 'lucide-react';
import { Plot, UserProfile } from '@/types';
import { AuthStore } from '@/lib/store/auth-store';

interface BrokerPlotActionModalProps {
  isOpen: boolean;
  plot: Plot | null;
  activeBroker: UserProfile;
  targetAction: 'book' | 'sold';
  onClose: () => void;
  onConfirm: (data: {
    status: 'booked' | 'sold';
    customerName: string;
    customerPhone: string;
    notes?: string;
    deedNumber?: string;
    paymentRef?: string;
    tokenAmount?: number;
  }) => void;
}

export const BrokerPlotActionModal: React.FC<BrokerPlotActionModalProps> = ({
  isOpen,
  plot,
  activeBroker,
  targetAction,
  onClose,
  onConfirm,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deedNumber, setDeedNumber] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [tokenAmount, setTokenAmount] = useState<number>(50000);
  const [notes, setNotes] = useState('');

  const brokerCode = activeBroker.broker_code || 'BRK-VIP-909';
  const myClients = AuthStore.getAllUsers().filter(
    (u) => u.role === 'client' && u.broker_code === brokerCode
  );

  useEffect(() => {
    if (plot) {
      setCustomerName(plot.customer_name || '');
      setCustomerPhone(plot.customer_phone || '');
      setDeedNumber(plot.deed_number || `DEED-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setPaymentRef(plot.payment_ref || `PAY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
      setTokenAmount(plot.token_amount || 50000);
    }
  }, [plot, isOpen]);

  if (!isOpen || !plot) return null;

  const handleSelectClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cid = e.target.value;
    setSelectedClientId(cid);
    if (cid) {
      const client = myClients.find((c) => c.id === cid);
      if (client) {
        setCustomerName(client.name);
        setCustomerPhone(client.phone || '');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetAction === 'book') {
      onConfirm({
        status: 'booked',
        customerName: customerName.trim() || 'Client Buyer',
        customerPhone: customerPhone.trim() || '+91 98765 43210',
        notes: notes || `Booked by Broker ${activeBroker.name} (Code: ${brokerCode})`,
        paymentRef,
        tokenAmount,
      });
    } else {
      onConfirm({
        status: 'sold',
        customerName: customerName.trim() || 'Client Buyer',
        customerPhone: customerPhone.trim() || '+91 98765 43210',
        deedNumber,
        notes: notes || `Sale Deed Registered. Verified by ${activeBroker.name}`,
      });
    }
    onClose();
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
          <div
            className={`p-2.5 rounded-xl border ${
              targetAction === 'book'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            {targetAction === 'book' ? <UserCheck className="w-6 h-6" /> : <FileCheck className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">
              {targetAction === 'book' ? `Book Plot ${plot.plot_number} for Client` : `Register Sale Deed (Plot ${plot.plot_number})`}
            </h2>
            <p className="text-xs text-slate-400">
              {targetAction === 'book'
                ? 'Map client account & issue 48-hr token hold'
                : 'Enter legal sale deed registration details'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {targetAction === 'book' ? (
            <>
              {/* Select Client Dropdown */}
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Map Onboarded Client Account</label>
                {myClients.length > 0 ? (
                  <select
                    value={selectedClientId}
                    onChange={handleSelectClientChange}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">-- Select Client from your Lead List --</option>
                    {myClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[11px] text-amber-400 italic">No onboarded client leads found under code {brokerCode}. Enter buyer details manually below:</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Client Buyer Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Mr. Rajesh Sharma"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Contact Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Token Advance (₹)</label>
                  <input
                    type="number"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Payment Ref #</label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. UPI-908123"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Sold Deed Registration Fields */}
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Allottee Buyer Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Mr. Rajesh Sharma"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold placeholder:text-slate-500 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Contact Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Sale Deed / RERA Registration ID *</label>
                <input
                  type="text"
                  required
                  value={deedNumber}
                  onChange={(e) => setDeedNumber(e.target.value)}
                  placeholder="e.g. DEED-2026-REG-987"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-rose-300 font-mono font-bold focus:border-rose-500 focus:outline-none"
                />
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">Legal Remarks / Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter registration office details, payment schedule or conditions..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 resize-none"
            />
          </div>

          <button
            type="submit"
            className={`w-full py-3 rounded-xl font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
              targetAction === 'book'
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
            }`}
          >
            {targetAction === 'book' ? <UserCheck className="w-4 h-4" /> : <FileCheck className="w-4 h-4" />}
            <span>{targetAction === 'book' ? 'Confirm Booking & Map Client' : 'Register Sale Deed & Mark Sold'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

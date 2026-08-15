'use client';

import React, { useState } from 'react';
import { Plot, PlotStatusHistory, PlotStatus } from '@/types';
import { StatusBadge, AiConfidenceBadge } from '@/components/common/StatusBadge';
import {
  X,
  Edit3,
  Calendar,
  DollarSign,
  Maximize2,
  Compass,
  UserCheck,
  Phone,
  Clock,
  History,
  Trash2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface PlotDetailsPanelProps {
  plot: Plot | null;
  history: PlotStatusHistory[];
  onClose: () => void;
  onStatusChange: (plotId: string, newStatus: PlotStatus, notes?: string, custName?: string, custPhone?: string) => void;
  onEditClick: (plot: Plot) => void;
  onDeleteClick: (plotId: string) => void;
  onSplitClick?: (plot: Plot) => void;
}

export const PlotDetailsPanel: React.FC<PlotDetailsPanelProps> = ({
  plot,
  history,
  onClose,
  onStatusChange,
  onEditClick,
  onDeleteClick,
  onSplitClick,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<PlotStatus>('booked');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  if (!plot) return null;

  const formatPrice = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString()}`;
  };

  const handleApplyStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    onStatusChange(plot.id, targetStatus, notes, customerName, customerPhone);
    setShowStatusModal(false);
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
  };

  return (
    <aside className="w-full sm:w-96 bg-slate-900 border-l border-slate-800 flex flex-col justify-between h-full shadow-2xl z-30 animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white tracking-tight">Plot {plot.plot_number}</h2>
            <AiConfidenceBadge confidence={plot.ai_confidence} />
          </div>
          <p className="text-xs text-slate-400 mt-1">Digital Site Plot Profile</p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'details'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Specifications</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Status Timeline ({history.length})</span>
        </button>
      </div>

      {/* Main Drawer Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {activeTab === 'details' ? (
          <>
            {/* Status Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-1">Current Availability</span>
                <StatusBadge status={plot.status} size="lg" />
              </div>
              <button
                onClick={() => {
                  setTargetStatus(plot.status === 'available' ? 'booked' : plot.status === 'booked' ? 'sold' : 'available');
                  setShowStatusModal(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md"
              >
                Change Status
              </button>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                  Plot Dimensions & Area
                </span>
                <span className="text-base font-bold text-white block">
                  {plot.dimensions_text || `${plot.area.toLocaleString()} sq.ft`}
                </span>
                {plot.area_cents && (
                  <span className="text-[11px] font-semibold text-cyan-400 block">
                    {plot.area_cents} Cents ({plot.area.toLocaleString()} sq.ft)
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Plot Price
                </span>
                <span className="text-base font-bold text-emerald-400 block">{formatPrice(plot.price)}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  Facing Direction
                </span>
                <span className="text-sm font-bold text-white block">{plot.facing} Facing</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  Last Updated
                </span>
                <span className="text-xs font-medium text-slate-300 block">
                  {new Date(plot.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Customer Details Section (if booked or sold) */}
            {plot.status !== 'available' && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  Customer & Allotment Info
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Allottee Name</span>
                    <span className="text-white font-semibold">{plot.customer_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Contact Number</span>
                    <span className="text-slate-200 font-mono">{plot.customer_phone || 'N/A'}</span>
                  </div>
                  {plot.booking_date && (
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Booking Date</span>
                      <span className="text-slate-200">
                        {new Date(plot.booking_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Timeline History Tab */
          <div className="space-y-4 relative pl-4 border-l border-slate-800">
            {history.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No status history recorded yet.</p>
            ) : (
              history.map((item) => (
                <div key={item.id} className="relative group">
                  {/* Timeline Dot */}
                  <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-slate-900" />

                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white capitalize">{item.new_status}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(item.changed_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-slate-400 text-[11px] leading-relaxed">{item.notes}</p>

                    <div className="pt-1 text-[10px] text-slate-500 flex items-center gap-1">
                      <span>Changed by:</span>
                      <span className="text-slate-300 font-semibold">{item.changed_by}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2">
        {onSplitClick && (
          <button
            onClick={() => onSplitClick(plot)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all"
          >
            <span>Subdivide Block</span>
          </button>
        )}

        <button
          onClick={() => onEditClick(plot)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Details</span>
        </button>

        <button
          onClick={() => onDeleteClick(plot.id)}
          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs transition-all"
          title="Delete Plot"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Update Status for Plot {plot.plot_number}</h3>

            <form onSubmit={handleApplyStatusChange} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Select New Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['available', 'booked', 'sold'] as PlotStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTargetStatus(st)}
                      className={`p-2.5 rounded-lg border capitalize font-semibold transition-all ${
                        targetStatus === st
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {targetStatus !== 'available' && (
                <>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold block">Customer Name</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Dr. Vikram Mehta"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold block">Phone Number</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Notes / Reason</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record advance receipt, deed details, or remarks..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500"
                >
                  Confirm Status Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};

'use client';

import React, { useState } from 'react';
import { Plot, PlotStatusHistory, PlotStatus, UserProfile } from '@/types';
import { StatusBadge, AiConfidenceBadge } from '@/components/common/StatusBadge';
import { AuthStore } from '@/lib/store/auth-store';
import { BrokerPlotActionModal } from '@/components/plot/BrokerPlotActionModal';
import { ClientPlotBookingModal } from '@/components/plot/ClientPlotBookingModal';
import {
  X,
  Edit3,
  Calendar,
  Maximize2,
  Compass,
  UserCheck,
  History,
  TrendingUp,
  FileCheck,
  Sparkles,
  Key,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface PlotDetailsPanelProps {
  plot: Plot | null;
  history: PlotStatusHistory[];
  onClose: () => void;
  onStatusChange: (
    plotId: string,
    newStatus: PlotStatus,
    notes?: string,
    custName?: string,
    custPhone?: string,
    deedNumber?: string,
    paymentRef?: string,
    tokenAmount?: number
  ) => void;
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

  // Broker Modal State
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [brokerTargetAction, setBrokerTargetAction] = useState<'book' | 'sold'>('book');

  // Client Modal State
  const [isClientBookingModalOpen, setIsClientBookingModalOpen] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  if (!plot) return null;

  const currentUser: UserProfile = AuthStore.getCurrentUser();
  const assignedBroker = AuthStore.getAssignedBrokerForClient(currentUser);

  const formatPrice = (val: number) => {
    if (!val || val === 0) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const handleApplyStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    onStatusChange(plot.id, targetStatus, notes, customerName, customerPhone);
    setShowStatusModal(false);
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
  };

  const handleBrokerConfirm = (data: {
    status: 'booked' | 'sold';
    customerName: string;
    customerPhone: string;
    notes?: string;
    deedNumber?: string;
    paymentRef?: string;
    tokenAmount?: number;
  }) => {
    onStatusChange(
      plot.id,
      data.status,
      data.notes,
      data.customerName,
      data.customerPhone,
      data.deedNumber,
      data.paymentRef,
      data.tokenAmount
    );
  };

  const handleClientConfirmBooking = (data: {
    customerName: string;
    customerPhone: string;
    tokenAmount: number;
    paymentRef: string;
    notes?: string;
  }) => {
    onStatusChange(
      plot.id,
      'booked',
      data.notes,
      data.customerName,
      data.customerPhone,
      undefined,
      data.paymentRef,
      data.tokenAmount
    );
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
            {/* Role-Tailored Availability & Action Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-400 block mb-1">Current Availability</span>
                  <StatusBadge status={plot.status} size="lg" />
                </div>

                {/* ADMIN ROLE ACTIONS */}
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      setTargetStatus(plot.status === 'available' ? 'booked' : plot.status);
                      setCustomerName(plot.customer_name || '');
                      setCustomerPhone(plot.customer_phone || '');
                      setShowStatusModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md"
                  >
                    Change Status
                  </button>
                )}
              </div>

              {/* BROKER ROLE ACTIONS */}
              {currentUser.role === 'broker' && (
                <div className="pt-2 border-t border-slate-900 flex flex-col gap-2">
                  {plot.status === 'available' && (
                    <>
                      <button
                        onClick={() => {
                          setBrokerTargetAction('book');
                          setIsBrokerModalOpen(true);
                        }}
                        className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Book Plot for Client</span>
                      </button>

                      <button
                        onClick={() => {
                          setBrokerTargetAction('sold');
                          setIsBrokerModalOpen(true);
                        }}
                        className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        <FileCheck className="w-4 h-4" />
                        <span>Mark as Sold (Legal Deed)</span>
                      </button>
                    </>
                  )}

                  {plot.status === 'booked' && (
                    <button
                      onClick={() => {
                        setBrokerTargetAction('sold');
                        setIsBrokerModalOpen(true);
                      }}
                      className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>Convert Booking to Sold (Legal Deed)</span>
                    </button>
                  )}
                </div>
              )}

              {/* CLIENT ROLE ACTIONS */}
              {currentUser.role === 'client' && (
                <div className="pt-2 border-t border-slate-900">
                  {plot.status === 'available' ? (
                    <button
                      onClick={() => setIsClientBookingModalOpen(true)}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-indigo-600 hover:scale-[1.02] text-white text-xs font-extrabold shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Book This Plot (Token Advance)</span>
                    </button>
                  ) : (() => {
                    const cName = (currentUser.name || '').trim().toLowerCase();
                    const cEmail = (currentUser.email || '').trim().toLowerCase();
                    const cPhone = (currentUser.phone || '').trim().toLowerCase();
                    const pName = (plot.customer_name || '').trim().toLowerCase();
                    const pPhone = (plot.customer_phone || '').trim().toLowerCase();

                    const isMine =
                      plot.status === 'booked' &&
                      pName.length > 0 &&
                      (
                        pName === cName ||
                        pName === cEmail ||
                        (cEmail.length > 0 && cEmail.includes('@') && pName === cEmail.split('@')[0]) ||
                        (pPhone.length >= 8 && cPhone.length >= 8 && pPhone === cPhone)
                      );

                    if (isMine) {
                      return (
                        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs space-y-2.5 shadow-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-extrabold text-sm text-emerald-400">
                              <CheckCircle2 className="w-4.5 h-4.5" />
                              <span>Your Reserved Plot</span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
                              Hold Active
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            Token advance received. 48-hr priority hold is active under your account ({currentUser.name}).
                          </p>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to cancel your reservation for Plot ${plot.plot_number}?`)) {
                                onStatusChange(plot.id, 'available', 'Reservation cancelled by client', '', '');
                              }
                            }}
                            className="w-full py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Cancel Reservation</span>
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/30 text-xs text-center space-y-1">
                        <span className="font-bold text-amber-400 block flex items-center justify-center gap-1">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Plot Currently Reserved (Booked)</span>
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          This plot is reserved by another buyer ({plot.customer_name || 'Booked'}). You cannot book it again.
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}
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
                  <span className="text-emerald-400 font-bold text-sm leading-none">₹</span>
                  Plot Price (INR)
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
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-indigo-400" />
                    Customer & Allotment Info
                  </h4>
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        setTargetStatus(plot.status);
                        setCustomerName(plot.customer_name || '');
                        setCustomerPhone(plot.customer_phone || '');
                        setShowStatusModal(true);
                      }}
                      className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Allottee</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Allottee Name</span>
                    <span className="text-white font-semibold">
                      {plot.customer_name ? (
                        <span className="text-emerald-400 font-bold">{plot.customer_name}</span>
                      ) : (
                        <span className="text-amber-400 italic">Not Specified</span>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Contact Number</span>
                    <span className="text-slate-200 font-mono">{plot.customer_phone || 'N/A'}</span>
                  </div>

                  {plot.deed_number && (
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Sale Deed Registration #</span>
                      <span className="text-rose-400 font-mono font-bold">{plot.deed_number}</span>
                    </div>
                  )}

                  {plot.payment_ref && (
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Token Payment Ref #</span>
                      <span className="text-cyan-300 font-mono font-bold">{plot.payment_ref}</span>
                    </div>
                  )}

                  {plot.token_amount && plot.token_amount > 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Token Advance Paid</span>
                      <span className="text-emerald-400 font-bold">₹{plot.token_amount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

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

                    <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500">
                      <span>By: {item.changed_by}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Admin Quick Action Footer */}
      {currentUser.role === 'admin' && (
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2">
          {onSplitClick && (
            <button
              onClick={() => onSplitClick(plot)}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <span>Subdivide Block</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditClick(plot)}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Edit Details</span>
            </button>

            <button
              onClick={() => onDeleteClick(plot.id)}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
              title="Delete plot"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Broker Action Modal */}
      <BrokerPlotActionModal
        isOpen={isBrokerModalOpen}
        plot={plot}
        activeBroker={currentUser}
        targetAction={brokerTargetAction}
        onClose={() => setIsBrokerModalOpen(false)}
        onConfirm={handleBrokerConfirm}
      />

      {/* Client Direct Booking Modal */}
      <ClientPlotBookingModal
        isOpen={isClientBookingModalOpen}
        plot={plot}
        activeClient={currentUser}
        assignedBroker={assignedBroker}
        onClose={() => setIsClientBookingModalOpen(false)}
        onConfirmBooking={handleClientConfirmBooking}
      />

      {/* Admin Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white">Change Status for Plot {plot.plot_number}</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyStatusChange} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Target Availability</label>
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
                      placeholder="e.g. Mr. Rajesh Sharma"
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

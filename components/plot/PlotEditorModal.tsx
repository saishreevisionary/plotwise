'use client';

import React, { useState, useEffect } from 'react';
import { Plot, PlotStatus, FacingDirection } from '@/types';
import { X, Check, FileEdit, DollarSign, Maximize2, Compass } from 'lucide-react';

interface PlotEditorModalProps {
  isOpen: boolean;
  plot?: Plot | null;
  layoutId: string;
  onClose: () => void;
  onSave: (plotData: Partial<Plot>) => void;
}

export const PlotEditorModal: React.FC<PlotEditorModalProps> = ({
  isOpen,
  plot,
  layoutId,
  onClose,
  onSave,
}) => {
  const [plotNumber, setPlotNumber] = useState('');
  const [area, setArea] = useState<number>(1200);
  const [price, setPrice] = useState<number>(0);
  const [facing, setFacing] = useState<FacingDirection>('East');
  const [status, setStatus] = useState<PlotStatus>('available');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  useEffect(() => {
    if (plot) {
      setPlotNumber(plot.plot_number);
      setArea(plot.area);
      setPrice(plot.price || 0);
      setFacing(plot.facing);
      setStatus(plot.status);
      setCustomerName(plot.customer_name || '');
      setCustomerPhone(plot.customer_phone || '');
    } else {
      setPlotNumber('A-41');
      setArea(1500);
      setPrice(0);
      setFacing('East');
      setStatus('available');
      setCustomerName('');
      setCustomerPhone('');
    }
  }, [plot, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      plot_number: plotNumber,
      area: Number(area),
      price: Number(price),
      facing,
      status,
      customer_name: customerName || undefined,
      customer_phone: customerPhone || undefined,
    });
    onClose();
  };

  const facings: FacingDirection[] = [
    'East',
    'West',
    'North',
    'South',
    'North-East',
    'North-West',
    'South-East',
    'South-West',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              {plot ? `Edit Plot ${plot.plot_number}` : 'Add New Site Plot'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">Plot Number / Code *</label>
            <input
              type="text"
              required
              value={plotNumber}
              onChange={(e) => setPlotNumber(e.target.value)}
              placeholder="e.g. A-27"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Area (sq.ft) *</label>
              <input
                type="number"
                required
                value={area}
                onChange={(e) => setArea(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Price (₹) *</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">Facing Direction</label>
            <select
              value={facing}
              onChange={(e) => setFacing(e.target.value as FacingDirection)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-medium"
            >
              {facings.map((f) => (
                <option key={f} value={f}>
                  {f} Facing
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">Plot Status</label>
            <div className="grid grid-cols-3 gap-2">
              {(['available', 'booked', 'sold'] as PlotStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`p-2 rounded-lg border capitalize font-semibold transition-all ${
                    status === st
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {status !== 'available' && (
            <div className="space-y-3 pt-1 border-t border-slate-800/60">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Allottee / Customer Full Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Dr. Vikram Mehta"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Contact Phone Number</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
            >
              Save Plot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Plot } from '@/types';
import { JoystickState } from './WalkCameraController';
import { X, MapPin, MoveUpRight } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Virtual Joystick (mobile only)
// ─────────────────────────────────────────────────────────────────────────────
const KNOB_RANGE = 38; // px from center to max deflection

const VirtualJoystick: React.FC<{
  joystickRef: React.MutableRefObject<JoystickState>;
}> = ({ joystickRef }) => {
  const baseRef  = useRef<HTMLDivElement>(null);
  const knobRef  = useRef<HTMLDivElement>(null);
  const touchId  = useRef<number | null>(null);
  const center   = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const base = baseRef.current;
    if (!base) return;

    const onStart = (e: TouchEvent) => {
      if (touchId.current !== null) return;
      const t = e.changedTouches[0];
      touchId.current = t.identifier;
      const r = base.getBoundingClientRect();
      center.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };

    const onMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier !== touchId.current) continue;

        const dx = t.clientX - center.current.x;
        const dy = t.clientY - center.current.y;
        const dist   = Math.min(Math.sqrt(dx * dx + dy * dy), KNOB_RANGE);
        const angle  = Math.atan2(dy, dx);
        const kx     = Math.cos(angle) * dist;
        const ky     = Math.sin(angle) * dist;

        if (knobRef.current) {
          knobRef.current.style.transform = `translate(${kx}px, ${ky}px)`;
        }
        joystickRef.current.x =  kx / KNOB_RANGE;
        joystickRef.current.z =  ky / KNOB_RANGE;
      }
    };

    const onEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier !== touchId.current) continue;
        touchId.current = null;
        if (knobRef.current) knobRef.current.style.transform = 'translate(0px,0px)';
        joystickRef.current.x = 0;
        joystickRef.current.z = 0;
      }
    };

    base.addEventListener('touchstart',  onStart, { passive: true });
    window.addEventListener('touchmove',  onMove,  { passive: true });
    window.addEventListener('touchend',   onEnd,   { passive: true });
    window.addEventListener('touchcancel', onEnd,  { passive: true });

    return () => {
      base.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove',  onMove);
      window.removeEventListener('touchend',   onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [joystickRef]);

  return (
    <div
      ref={baseRef}
      className="w-28 h-28 rounded-full bg-slate-800/60 border-2 border-slate-500/60 backdrop-blur-md flex items-center justify-center touch-none select-none shadow-2xl"
    >
      <div
        ref={knobRef}
        className="w-12 h-12 rounded-full bg-indigo-500/85 border-2 border-indigo-300/80 shadow-lg shadow-indigo-500/40"
        style={{ transform: 'translate(0px,0px)', willChange: 'transform', transition: 'none' }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Utility: format INR price
// ─────────────────────────────────────────────────────────────────────────────
function fmtPrice(price: number): string {
  if (price >= 10_000_000) return `₹${(price / 10_000_000).toFixed(2)} Cr`;
  if (price >= 100_000)    return `₹${(price / 100_000).toFixed(2)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
interface WalkModeOverlayProps {
  isActive:       boolean;
  nearbyPlot:     Plot | null;
  joystickRef:    React.MutableRefObject<JoystickState>;
  onExit:         () => void;
  onViewDetails:  (plot: Plot) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main overlay
// ─────────────────────────────────────────────────────────────────────────────
export const WalkModeOverlay: React.FC<WalkModeOverlayProps> = ({
  isActive,
  nearbyPlot,
  joystickRef,
  onExit,
  onViewDetails,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
  }, []);

  if (!isActive) return null;

  const statusColor =
    nearbyPlot?.status === 'available' ? 'text-emerald-400' :
    nearbyPlot?.status === 'booked'    ? 'text-amber-400'   : 'text-rose-400';

  const statusDot =
    nearbyPlot?.status === 'available' ? '🟢' :
    nearbyPlot?.status === 'booked'    ? '🟡' : '🔴';

  return (
    <>
      {/* ── Top centre badge ── */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <div className="bg-emerald-700/85 backdrop-blur-md border border-emerald-500/50 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-2xl shadow-emerald-900/50">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
          <span className="text-white text-[11px] font-bold tracking-widest uppercase">Walk Mode</span>
          {!isMobile && (
            <span className="text-emerald-200 text-[10px] hidden sm:inline">
              · Click canvas to capture mouse · ESC to exit
            </span>
          )}
        </div>
      </div>

      {/* ── Exit button (top-right) ── */}
      <button
        onClick={onExit}
        className="absolute top-14 right-4 z-30 bg-rose-600/90 hover:bg-rose-500 active:bg-rose-700 backdrop-blur-md border border-rose-500/50 rounded-xl px-3.5 py-2 flex items-center gap-2 text-white text-xs font-bold shadow-xl transition-all"
        aria-label="Exit Walk Mode"
      >
        <X className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Exit Walk Mode</span>
        <span className="sm:hidden">Exit</span>
      </button>

      {/* ── WASD hint (bottom-left, desktop) ── */}
      {!isMobile && (
        <div className="absolute bottom-16 left-4 z-30 pointer-events-none select-none">
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 space-y-2.5 shadow-xl">
            <div className="flex justify-center">
              <kbd className="bg-slate-700 text-slate-100 text-[11px] font-mono px-3 py-1.5 rounded-lg border border-slate-500 shadow">
                W
              </kbd>
            </div>
            <div className="flex items-center gap-1.5 justify-center">
              {['A', 'S', 'D'].map((k) => (
                <kbd key={k} className="bg-slate-700 text-slate-100 text-[11px] font-mono px-3 py-1.5 rounded-lg border border-slate-500 shadow">
                  {k}
                </kbd>
              ))}
            </div>
            <div className="border-t border-slate-700 pt-2 space-y-0.5">
              <p className="text-slate-400 text-[9px] text-center tracking-wide">MOUSE · Look around</p>
              <p className="text-slate-500 text-[9px] text-center">ESC · Exit</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Virtual joystick (bottom-left, mobile) ── */}
      {isMobile && (
        <div className="absolute bottom-16 left-6 z-30">
          <VirtualJoystick joystickRef={joystickRef} />
          <p className="text-slate-500 text-[9px] text-center mt-1.5 pointer-events-none">Move</p>
        </div>
      )}

      {/* ── Nearby plot info panel (bottom-right) ── */}
      {nearbyPlot && (
        <div className="absolute bottom-16 right-4 z-30 w-56 pointer-events-auto">
          <div className="bg-slate-900/96 backdrop-blur-xl border border-slate-700/90 rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
            {/* Header */}
            <div className="bg-indigo-900/50 border-b border-slate-700/60 px-4 py-2.5 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-white font-extrabold text-sm tracking-tight">
                Plot {nearbyPlot.plot_number}
              </span>
            </div>

            {/* Details */}
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>{nearbyPlot.area.toLocaleString('en-IN')} sq.ft</span>
                <span className="text-slate-400">{nearbyPlot.facing} Facing</span>
              </div>

              <div className="text-base font-extrabold text-white tracking-tight">
                {fmtPrice(nearbyPlot.price)}
              </div>

              <div className={`text-xs font-bold ${statusColor}`}>
                {statusDot} {nearbyPlot.status.charAt(0).toUpperCase() + nearbyPlot.status.slice(1)}
              </div>
            </div>

            {/* CTA */}
            <div className="px-4 pb-3">
              <button
                onClick={() => onViewDetails(nearbyPlot)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30"
              >
                View Plot Details
                <MoveUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

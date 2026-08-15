import React from 'react';
import { PlotStatus } from '@/types';
import { CheckCircle2, Clock, Ban, AlertTriangle, Sparkles } from 'lucide-react';

interface StatusBadgeProps {
  status: PlotStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', showIcon = true }) => {
  const configs = {
    available: {
      label: 'Available',
      bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300',
      dot: 'bg-emerald-500',
      icon: CheckCircle2,
    },
    booked: {
      label: 'Booked',
      bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300',
      dot: 'bg-amber-500',
      icon: Clock,
    },
    sold: {
      label: 'Sold',
      bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300',
      dot: 'bg-rose-500',
      icon: Ban,
    },
  };

  const config = configs[status] || configs.available;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 space-x-1',
    md: 'text-sm px-2.5 py-1 space-x-1.5',
    lg: 'text-base px-3 py-1.5 space-x-2 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${sizeClasses[size]} transition-all shadow-xs`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      {showIcon && <Icon className="w-3.5 h-3.5 opacity-80" />}
      <span>{config.label}</span>
    </span>
  );
};

export const AiConfidenceBadge: React.FC<{ confidence: number }> = ({ confidence }) => {
  const pct = Math.round(confidence * 100);

  let colorClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  let label = 'High Confidence';
  let Icon = Sparkles;

  if (confidence < 0.6) {
    colorClass = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    label = 'Low Confidence';
    Icon = AlertTriangle;
  } else if (confidence < 0.85) {
    colorClass = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    label = 'Review Required';
    Icon = AlertTriangle;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border font-mono font-medium ${colorClass}`}
    >
      <Icon className="w-3 h-3" />
      <span>AI {pct}%</span>
      <span className="opacity-75 font-sans">({label})</span>
    </span>
  );
};

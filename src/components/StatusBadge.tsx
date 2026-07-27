import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'health' | 'device' | 'alert' | 'user' | 'schedule';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  const normalized = status.toLowerCase();

  if (normalized === 'healthy' || normalized === 'online' || normalized === 'active' || normalized === 'dispensed' || normalized === 'success' || normalized === 'resolved') {
    badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
  } else if (normalized === 'attention needed' || normalized === 'warning' || normalized === 'in review' || normalized === 'pending') {
    badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (normalized === 'critical' || normalized === 'offline' || normalized === 'inactive' || normalized === 'failed' || normalized === 'unreviewed') {
    badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500';
  } else if (normalized === 'info') {
    badgeStyle = 'bg-sky-50 text-sky-700 border-sky-200';
    dotColor = 'bg-sky-500';
  }

  const pxClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${pxClass} ${badgeStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {status}
    </span>
  );
};

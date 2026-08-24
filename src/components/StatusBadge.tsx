import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'health' | 'device' | 'alert' | 'user' | 'schedule' | 'hardware' | 'session' | 'access';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  const normalized = status.toLowerCase();

  // Green — positive / active states
  if (normalized === 'healthy' || normalized === 'online' || normalized === 'active' || normalized === 'dispensed' || normalized === 'success' || normalized === 'resolved' || normalized === 'available') {
    badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
  }
  // Amber — warning / pending / queued states
  else if (normalized === 'queued') {
    badgeStyle = 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold shadow-xs';
    dotColor = 'bg-amber-600 animate-ping';
  }
  else if (normalized === 'attention needed' || normalized === 'warning' || normalized === 'in review' || normalized === 'pending' || normalized === 'maintenance') {
    badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
  }
  // Rose — critical / failed / cancelled states
  else if (normalized === 'critical' || normalized === 'offline' || normalized === 'failed' || normalized === 'unreviewed' || normalized === 'cancelled') {
    badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500';
  }
  // Sky — informational
  else if (normalized === 'info') {
    badgeStyle = 'bg-sky-50 text-sky-700 border-sky-200';
    dotColor = 'bg-sky-500';
  }
  // Purple — super admin
  else if (normalized === 'super admin') {
    badgeStyle = 'bg-purple-50 text-purple-700 border-purple-300 font-extrabold shadow-xs';
    dotColor = 'bg-purple-600 animate-pulse';
  }
  // Indigo — occupied
  else if (normalized === 'occupied') {
    badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    dotColor = 'bg-indigo-500 animate-pulse';
  }
  // Teal — completed
  else if (normalized === 'completed') {
    badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500';
  }
  // Slate — inactive
  else if (normalized === 'inactive') {
    badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';
    dotColor = 'bg-slate-400';
  }
  // Violet — archived
  else if (normalized === 'archived') {
    badgeStyle = 'bg-violet-50 text-violet-700 border-violet-200';
    dotColor = 'bg-violet-500';
  }

  const pxClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${pxClass} ${badgeStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {status}
    </span>
  );
};

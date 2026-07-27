import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  action
}) => {
  return (
    <div className="clinic-card p-10 flex flex-col items-center justify-center text-center my-4">
      <div className="p-4 rounded-2xl bg-slate-100 text-slate-400 mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

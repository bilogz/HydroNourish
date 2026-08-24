import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconTextColor?: string;
  badgeText?: string;
  badgeType?: 'success' | 'warning' | 'alert' | 'info';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-rose-50',
  iconTextColor = 'text-rose-600',
  badgeText,
  badgeType = 'info'
}) => {
  const badgeStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    alert: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200'
  };

  return (
    <div className="clinic-card p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">{value}</div>
        </div>
        <div className={`p-3 rounded-xl ${iconBgColor} ${iconTextColor}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {(subtitle || badgeText) && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs">
          {subtitle && <span className="text-slate-500 font-medium">{subtitle}</span>}
          {badgeText && (
            <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${badgeStyles[badgeType]}`}>
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

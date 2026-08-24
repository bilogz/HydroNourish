import React from 'react';
import { AIHealthAlert } from '../types';
import { StatusBadge } from './StatusBadge';
import { useAppContext } from '../hooks/useAppContext';
import { Bot, CheckCircle, Clock, ShieldAlert, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AlertCardProps {
  alert: AIHealthAlert;
  compact?: boolean;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, compact = false }) => {
  const { acknowledgeAlert, resolveAlert } = useAppContext();

  const borderColors = {
    Critical: 'border-l-4 border-l-rose-500',
    Warning: 'border-l-4 border-l-amber-500',
    Info: 'border-l-4 border-l-sky-500'
  };

  return (
    <div className={`clinic-card p-5 ${borderColors[alert.severity]} transition-all`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{alert.id}</span>
          <span className="text-slate-300">•</span>
          <Link
            to={`/app/pets/${alert.petId}`}
            className="text-sm font-bold text-slate-900 hover:text-rose-600 transition-colors inline-flex items-center gap-1"
          >
            {alert.petName}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={alert.reviewStatus} size="sm" />
          <StatusBadge status={alert.severity} size="sm" />
        </div>
      </div>

      <h4 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
        <ShieldAlert className={`w-4 h-4 shrink-0 ${alert.severity === 'Critical' ? 'text-rose-500' : 'text-amber-500'}`} />
        {alert.alertType}
      </h4>

      <p className="text-xs text-slate-600 font-medium mt-1">
        Observed Reading: <span className="text-slate-900 font-semibold">{alert.observedReading}</span>
      </p>

      {!compact && (
        <>
          <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <Bot className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800">AI Observation:</span>{' '}
                <span className="text-slate-600">{alert.aiObservation}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200/60 font-medium text-slate-700">
              <span className="font-bold text-rose-700">Recommended Action:</span> {alert.recommendedAction}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {alert.timestamp}
            </span>

            <div className="flex items-center gap-2">
              {alert.reviewStatus === 'Unreviewed' && (
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Mark In Review
                </button>
              )}
              {alert.reviewStatus !== 'Resolved' && (
                <button
                  onClick={() => resolveAlert(alert.id)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Resolve Alert
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

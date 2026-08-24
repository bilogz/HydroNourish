import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { AlertCard } from '../components/AlertCard';
import { StatusBadge } from '../components/StatusBadge';
import { useAppContext } from '../hooks/useAppContext';
import {
  Bot,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Filter,
  Check
} from 'lucide-react';

export const AIAlertsPage: React.FC = () => {
  const { alerts, acknowledgeAlert, resolveAlert } = useAppContext();
  const [activeTab, setActiveTab] = useState<'All' | 'Unresolved' | 'Critical'>('All');

  const filteredAlerts = (alerts || []).filter(a => {
    if (activeTab === 'Unresolved') return a.reviewStatus !== 'Resolved';
    if (activeTab === 'Critical') return a.severity === 'Critical';
    return true;
  });

  const criticalCount = (alerts || []).filter(a => a.severity === 'Critical' && a.reviewStatus !== 'Resolved').length;
  const warningCount = (alerts || []).filter(a => a.severity === 'Warning' && a.reviewStatus !== 'Resolved').length;
  const resolvedCount = (alerts || []).filter(a => a.reviewStatus === 'Resolved').length;

  return (
    <DashboardLayout pageTitle="AI-Assisted Health Observations" breadcrumbs={[{ label: 'AI Health Alerts' }]}>
      {/* ================= MANDATORY MEDICAL SAFETY NOTICE ================= */}
      <div className="clinic-card p-4 bg-rose-500/10 border-rose-200 text-xs text-rose-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-rose-600 shrink-0" />
          <span>
            <strong>Clinical Safety Protocol:</strong> AI observations indicate possible abnormal readings or telemetry deviations. They serve as supportive observations for Heritage Animal Clinic staff and are not confirmed medical diagnoses.
          </span>
        </div>
      </div>

      {/* ================= STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Critical Alerts"
          value={criticalCount}
          subtitle="Immediate Vet Exam Needed"
          icon={ShieldAlert}
          iconBgColor="bg-rose-50"
          iconTextColor="text-rose-600"
          badgeText={criticalCount > 0 ? 'Urgent Action' : 'Clear'}
          badgeType={criticalCount > 0 ? 'alert' : 'success'}
        />
        <StatCard
          title="Warning Level Alerts"
          value={warningCount}
          subtitle="Monitoring Advised"
          icon={Clock}
          iconBgColor="bg-amber-50"
          iconTextColor="text-amber-600"
          badgeText="Pending Review"
          badgeType="warning"
        />
        <StatCard
          title="Resolved Observations"
          value={resolvedCount}
          subtitle="Addressed by Clinic Staff"
          icon={CheckCircle2}
          iconBgColor="bg-emerald-50"
          iconTextColor="text-emerald-600"
          badgeText="Resolved"
          badgeType="success"
        />
      </div>

      {/* ================= FILTER TABS ================= */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('All')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'All' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Observations ({(alerts ?? []).length})
        </button>
        <button
          onClick={() => setActiveTab('Unresolved')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'Unresolved' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unresolved Needs Review ({(alerts ?? []).filter(a => a.reviewStatus !== 'Resolved').length})
        </button>
        <button
          onClick={() => setActiveTab('Critical')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'Critical' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Critical ({criticalCount})
        </button>
      </div>

      {/* ================= ALERTS CARDS GRID ================= */}
      <div className="space-y-4">
        {filteredAlerts.map(alert => (
          <AlertCard key={alert.id} alert={alert} compact={false} />
        ))}
      </div>

      {/* ================= ALERTS DETAILED SUMMARY TABLE ================= */}
      <div className="space-y-4 pt-4">
        <h2 className="text-base font-extrabold text-slate-900">Observation Records Master Table</h2>
        <div className="clinic-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Alert ID</th>
                  <th className="px-4 py-3">Patient Pet</th>
                  <th className="px-4 py-3">Observed Telemetry</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">AI Observation Summary</th>
                  <th className="px-4 py-3">Review Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredAlerts.map(alert => (
                  <tr key={alert.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-mono font-bold text-slate-400">{alert.id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{alert.petName}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{alert.observedReading}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={alert.severity} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{alert.aiObservation}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={alert.reviewStatus} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {alert.reviewStatus !== 'Resolved' && (
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px]"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

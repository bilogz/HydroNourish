/**
 * ============================================================================
 * HYDRO NOURISH — VISION ANALYTICS & TELEMETRY MODAL
 * ============================================================================
 * Comprehensive visual analytics center displaying 24-hour visit activity,
 * dwell time telemetry, posture trends, and snapshot audit logs.
 * ============================================================================
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Activity,
  Sparkles,
  Download,
  Utensils,
  Droplets,
  HeartPulse,
  Eye,
  CheckCircle2,
  Clock,
  Scan,
  Zap,
  ShieldCheck,
  RefreshCw,
  Trash2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  getVisionAnalyticsRecords,
  calculateDailyVisionSummary,
  exportVisionAnalyticsCSV,
  clearVisionAnalyticsHistory
} from '../../services/visionAnalyticsService';
import { PetVisionAnalyticsRecord } from '../../types';

interface VisionAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  petId?: string;
  petName?: string;
  petSpecies?: string;
  onRunImmediateScan?: () => void;
}

export const VisionAnalyticsModal: React.FC<VisionAnalyticsModalProps> = ({
  isOpen,
  onClose,
  petId = 'PET-001',
  petName = 'Max',
  petSpecies = 'Canine (Dog)',
  onRunImmediateScan
}) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState<PetVisionAnalyticsRecord | null>(null);

  const summary = useMemo(() => {
    return calculateDailyVisionSummary(petId);
  }, [petId, refreshKey]);

  const records = useMemo(() => {
    return getVisionAnalyticsRecords(petId);
  }, [petId, refreshKey]);

  if (!isOpen) return null;

  const handleExportCSV = () => {
    const csvContent = exportVisionAnalyticsCSV(petId);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `hydronourish_vision_analytics_${petName}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClear = () => {
    if (confirm('Clear local vision telemetry history for this station?')) {
      clearVisionAnalyticsHistory();
      setRefreshKey((prev) => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-5 text-white animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-inner">
              <Activity className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-lg text-slate-100">
                  Station Vision Telemetry & AI Analytics
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  REAL-TIME OPTICAL AUDIT
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Patient: <span className="text-slate-200 font-bold">{petName}</span> ({petSpecies}) • Dwell Times, Posture Health & AI Closed-Loop Actions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-bold flex items-center gap-1.5"
              title="Download CSV report"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/90 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-bold uppercase tracking-wider text-[10px]">Today's Visits</span>
              <Scan className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-white">{summary.totalVisits}</div>
            <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {summary.averageConfidence}% AI Confidence
            </p>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/90 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-bold uppercase tracking-wider text-[10px]">Feeding Dwell</span>
              <Utensils className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-300">{summary.feedingMinutes} <span className="text-xs font-normal text-slate-400">min</span></div>
            <p className="text-[10px] text-slate-400 mt-1">Smart Bowl Zone Time</p>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/90 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-bold uppercase tracking-wider text-[10px]">Hydration Dwell</span>
              <Droplets className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-sky-300">{summary.hydrationMinutes} <span className="text-xs font-normal text-slate-400">min</span></div>
            <p className="text-[10px] text-slate-400 mt-1">Water Dispenser Spout</p>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/90 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-bold uppercase tracking-wider text-[10px]">Health & Vigor</span>
              <HeartPulse className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300">{summary.averageHealthScore} <span className="text-xs font-normal text-slate-400">/ 100</span></div>
            <p className="text-[10px] text-amber-400/90 mt-1">Optimal Mobility Index</p>
          </div>
        </div>

        {/* 24-Hour Timeline & Posture Distribution Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Hourly Timeline Chart (col-span-8) */}
          <div className="lg:col-span-8 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/90">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-400" />
                <h4 className="font-bold text-xs text-slate-200">
                  Recent Station Visits Timeline (By Hour)
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Optical Detections</span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.hourlyTimeline} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#334155' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      fontSize: '11px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                  <Bar dataKey="feeding" name="Feeding Visits" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="hydrating" name="Hydrating Visits" fill="#0ea5e9" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="resting" name="Resting at Station" fill="#8b5cf6" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Behavior Breakdown & Health Status (col-span-4) */}
          <div className="lg:col-span-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/90 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Behavioral Activity Mix
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Today</span>
              </div>

              <div className="space-y-2">
                {summary.activityBreakdown.map((act, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300 font-medium">{act.name}</span>
                      <span className="text-slate-400 font-mono font-bold">{act.value} detections</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          backgroundColor: act.color,
                          width: `${Math.max(10, Math.min(100, (act.value / (summary.totalVisits || 1)) * 100))}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                AI Veterinary Assessment:
              </span>
              <p className="text-[11px] text-slate-300">
                Nutritional posture is well-balanced with no signs of hesitation or regurgitation. Hydration frequency meets clinical targets.
              </p>
            </div>
          </div>
        </div>

        {/* Historical Vision Telemetry Log */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-sky-400" />
              Visual Observation Audit Log ({records.length} events)
            </h4>
            <div className="flex items-center gap-2">
              {onRunImmediateScan && (
                <button
                  onClick={() => {
                    onRunImmediateScan();
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Run AI Scan Now
                </button>
              )}
              <button
                onClick={handleClear}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-xs"
                title="Clear history"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {records.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedRecord(r)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-wrap items-center justify-between gap-3 ${
                  selectedRecord?.id === r.id
                    ? 'bg-slate-800/90 border-rose-500/50 shadow-md'
                    : 'bg-slate-950/60 hover:bg-slate-950/90 border-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border ${
                    r.activity === 'Feeding'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : r.activity === 'Hydrating'
                      ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                      : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                  }`}>
                    {r.activity === 'Feeding' ? <Utensils className="w-4 h-4" /> : r.activity === 'Hydrating' ? <Droplets className="w-4 h-4" /> : <Scan className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-100">{r.activity}</span>
                      <span className="text-[10px] font-mono text-slate-400">• {r.timestamp}</span>
                      <span className="px-2 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {r.provider}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate max-w-md">
                      {r.actionDetails || r.clinicalNotes[0] || 'Visual telemetry logged'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="text-right">
                    <span className="block text-[10px] font-mono text-slate-400">Confidence</span>
                    <span className="font-mono text-xs font-bold text-emerald-400">{r.confidenceScore}%</span>
                  </div>

                  {r.actionTriggered !== 'None' ? (
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      {r.actionTriggered}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                      Passive Log
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[10px]">
            Station Node: ESP32-CAM AI Vision Reticle • Optical Auto-Sync Active
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all cursor-pointer"
          >
            Close Analytics
          </button>
        </div>
      </div>
    </div>
  );
};

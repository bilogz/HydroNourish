/**
 * HydroNourish — Owner Dashboard Page
 * Read-only monitoring view for pet owners with an active session.
 */

import React, { useState, useEffect } from 'react';
import { useSession } from '../contexts/SessionContext';
import { useAppContext } from '../hooks/useAppContext';
import { StatusBadge } from '../components/StatusBadge';
import { Logo } from '../components/Logo';
import {
  Dog,
  Utensils,
  Droplets,
  Activity,
  Heart,
  Thermometer,
  Clock,
  Calendar,
  Wifi,
  WifiOff,
  ShieldAlert,
  Zap,
  LogOut,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const OwnerDashboardPage: React.FC = () => {
  const { activeSession, hardware, owners } = useSession();
  const { pets, feedingLogs, hydrationLogs, vitals, alerts } = useAppContext();

  // Check localStorage for owner access
  const [ownerEmail, setOwnerEmail] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('hn_owner_email');
    if (saved) {
      setOwnerEmail(saved);
      setIsAuthed(true);
    }
  }, []);

  const currentOwner = owners.find(o => o.email === ownerEmail && o.accessStatus === 'active');
  const hasActiveSession = activeSession && currentOwner && activeSession.ownerId === currentOwner.id;
  const sessionPet = hasActiveSession ? (pets ?? []).find(p => p.id === activeSession.petId) : null;

  // Session-specific records
  const sessionFeedings = (feedingLogs ?? []).filter(f => f.sessionId === activeSession?.id || (hasActiveSession && f.petId === activeSession?.petId)).slice(0, 5);
  const sessionHydration = (hydrationLogs ?? []).filter(h => h.sessionId === activeSession?.id || (hasActiveSession && h.petId === activeSession?.petId)).slice(0, 5);
  const sessionVitals = (vitals ?? []).filter(v => v.sessionId === activeSession?.id || (hasActiveSession && v.petId === activeSession?.petId)).slice(0, 3);
  const sessionAlerts = (alerts ?? []).filter(a => a.sessionId === activeSession?.id || (hasActiveSession && a.petId === activeSession?.petId));

  const isOnline = hardware.status === 'Online';

  // Live session elapsed
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    if (!hasActiveSession) return;
    const calc = () => {
      const start = new Date(activeSession!.startTime).getTime();
      const diff = Date.now() - start;
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      return d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m` : `${m}m`;
    };
    setElapsed(calc());
    const t = setInterval(() => setElapsed(calc()), 60000);
    return () => clearInterval(t);
  }, [hasActiveSession, activeSession]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) return;
    localStorage.setItem('hn_owner_email', loginEmail.trim().toLowerCase());
    setOwnerEmail(loginEmail.trim().toLowerCase());
    setIsAuthed(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('hn_owner_email');
    setOwnerEmail('');
    setIsAuthed(false);
    setLoginEmail('');
  };

  // ─── Not authenticated — show simple login ─────────────────────────────
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-sky-50/30 flex items-center justify-center p-4">
        <div className="clinic-card max-w-md w-full p-8 space-y-6">
          <div className="text-center">
            <Logo size="lg" />
            <h2 className="text-xl font-extrabold text-slate-900 mt-4">Owner Monitoring Portal</h2>
            <p className="text-xs text-slate-500 mt-1">Enter your email to access your pet's monitoring dashboard.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
              <input
                type="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-sm font-semibold focus:border-teal-500 focus:outline-none"
                placeholder="your.email@example.com"
                required
              />
            </div>
            <button type="submit" className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-md transition-all">
              Access Dashboard
            </button>
          </form>
          <div className="text-center">
            <Link to="/" className="text-xs text-teal-600 hover:underline font-semibold">← Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Session ended or no access ────────────────────────────────────────
  if (!hasActiveSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-sky-50/30">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500">{ownerEmail}</span>
              <button onClick={handleLogout} className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors" title="Exit">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>
        <div className="max-w-2xl mx-auto mt-20 p-8 text-center">
          <div className="w-20 h-20 rounded-3xl bg-teal-50 text-teal-500 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Monitoring Session Completed</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Your pet's HydroNourish monitoring session has been completed. Please contact the clinic if you need a copy of the monitoring summary.
          </p>
          <div className="mt-8">
            <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-sm hover:bg-teal-500 transition-all">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Active session — full monitoring dashboard ────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" iconOnly={false} />
            <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-[10px] font-extrabold border border-teal-200">
              VIEW ONLY
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600 hidden sm:inline">{currentOwner?.name}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
            </span>
            <button onClick={handleLogout} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors" title="Exit Portal">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
        {/* Pet Profile Card */}
        <div className="clinic-card overflow-hidden">
          <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-sky-700 p-6">
            <div className="flex items-center gap-5">
              <img src={activeSession.petAvatarUrl} alt={activeSession.petName} className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/20 shadow-lg" />
              <div className="text-white">
                <h2 className="text-2xl font-extrabold tracking-tight">{activeSession.petName}</h2>
                <p className="text-teal-100 text-sm">{activeSession.petSpecies} • {activeSession.petBreed} • {activeSession.petSnapshot.weight}kg</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-teal-200">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Admitted {new Date(activeSession.admissionDate).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Session: {elapsed}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div><span className="text-slate-500 block">Expected Release</span><span className="font-bold text-slate-800">{new Date(activeSession.expectedReleaseDate).toLocaleDateString()}</span></div>
            <div><span className="text-slate-500 block">Feeding Plan</span><span className="font-bold text-slate-800">{sessionPet?.feedingPlan.portionGrams || activeSession.petSnapshot.feedingPlan.portionGrams}g × {sessionPet?.feedingPlan.timesPerDay || activeSession.petSnapshot.feedingPlan.timesPerDay}/day</span></div>
            <div><span className="text-slate-500 block">Hydration Target</span><span className="font-bold text-slate-800">{sessionPet?.hydrationTarget || activeSession.petSnapshot.hydrationTarget} ml/day</span></div>
            <div>
              <span className="text-slate-500 block">Device Status</span>
              <span className={`font-bold ${isOnline ? 'text-emerald-600' : 'text-rose-600'} flex items-center gap-1`}>
                {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                {hardware.status} • {hardware.lastTransmission}
              </span>
            </div>
          </div>
        </div>

        {/* Levels & Vitals Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Food Level */}
          <div className="clinic-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600"><Utensils className="w-4 h-4 text-orange-500" /> Food Level</span>
              <span className="text-sm font-extrabold text-slate-900">{hardware.foodLevelPct}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div className={`h-3 rounded-full transition-all ${hardware.foodLevelPct > 30 ? 'bg-gradient-to-r from-orange-400 to-amber-400' : 'bg-rose-500'}`} style={{ width: `${hardware.foodLevelPct}%` }} />
            </div>
          </div>

          {/* Water Level */}
          <div className="clinic-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600"><Droplets className="w-4 h-4 text-sky-500" /> Water Level</span>
              <span className="text-sm font-extrabold text-slate-900">{hardware.waterLevelPct}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div className={`h-3 rounded-full transition-all ${hardware.waterLevelPct > 30 ? 'bg-gradient-to-r from-sky-400 to-blue-400' : 'bg-rose-500'}`} style={{ width: `${hardware.waterLevelPct}%` }} />
            </div>
          </div>

          {/* Temperature */}
          <div className="clinic-card p-4 text-center">
            <Thermometer className="w-5 h-5 text-rose-500 mx-auto mb-1" />
            <span className="text-xs text-slate-500 block">Temperature</span>
            <span className="text-xl font-extrabold text-slate-900">{sessionPet?.latestVitals.temperature || '38.5'}°C</span>
          </div>

          {/* Heart Rate */}
          <div className="clinic-card p-4 text-center">
            <Heart className="w-5 h-5 text-pink-500 mx-auto mb-1" />
            <span className="text-xs text-slate-500 block">Heart Rate</span>
            <span className="text-xl font-extrabold text-slate-900">{sessionPet?.latestVitals.heartRate || '85'} <span className="text-sm font-bold text-slate-400">bpm</span></span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Latest Feeding */}
          <div className="clinic-card p-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4"><Utensils className="w-4 h-4 text-orange-500" /> Latest Feeding Activity</h3>
            <div className="space-y-2">
              {sessionFeedings.length > 0 ? sessionFeedings.map(f => (
                <div key={f.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{f.portionGrams}g</span>
                    <span className="text-slate-400 ml-2">{f.dispensedAt}</span>
                  </div>
                  <StatusBadge status={f.status} size="sm" />
                </div>
              )) : (
                <p className="text-xs text-slate-500 text-center py-4">No feeding records yet.</p>
              )}
            </div>
          </div>

          {/* Latest Hydration */}
          <div className="clinic-card p-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4"><Droplets className="w-4 h-4 text-sky-500" /> Hydration Activity</h3>
            <div className="space-y-2">
              {sessionHydration.length > 0 ? sessionHydration.map(h => (
                <div key={h.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{h.amountMl}ml</span>
                    <span className="text-slate-400 ml-2">{h.timestamp}</span>
                  </div>
                  <span className="text-slate-500 font-medium">Reservoir: {h.reservoirLevelPct}%</span>
                </div>
              )) : (
                <p className="text-xs text-slate-500 text-center py-4">No hydration records yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Health Alerts */}
        {sessionAlerts.length > 0 && (
          <div className="clinic-card p-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4"><ShieldAlert className="w-4 h-4 text-rose-500" /> Health Alerts</h3>
            <div className="space-y-3">
              {sessionAlerts.map(alert => (
                <div key={alert.id} className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800">{alert.alertType}</span>
                    <StatusBadge status={alert.severity} size="sm" />
                  </div>
                  <p className="text-xs text-slate-600">{alert.aiObservation}</p>
                  <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Health alerts require veterinary review. This is not a confirmed diagnosis.</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Demo Data Notice */}
        <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 font-medium flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          Hardware readings shown are demonstration data. Do not treat vital-sign readings as confirmed diagnoses. All health concerns should be discussed with your veterinarian.
        </div>
      </main>
    </div>
  );
};

/**
 * HydroNourish — Owner Dashboard Page
 * Heritage Animal Clinic Capstone Project
 *
 * Dedicated, fully-functional monitoring portal for registered pet owners.
 * Exclusively scoped to the logged-in owner's pets, intake records, vitals, and monitoring sessions.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from '../contexts/SessionContext';
import { useAppContext } from '../hooks/useAppContext';
import { StatusBadge } from '../components/StatusBadge';
import { Logo } from '../components/Logo';
import { LiveCameraWidget } from '../components/LiveCameraWidget';
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
  LogOut,
  AlertTriangle,
  CheckCircle,
  Info,
  User,
  PlusCircle,
  FileText,
  History,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';

type OwnerTab = 'monitoring' | 'pets' | 'intake' | 'alerts' | 'history';

interface OwnerHomeNote {
  id: string;
  petName: string;
  timestamp: string;
  noteText: string;
}

export const OwnerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeSession, sessions, hardware, owners } = useSession();
  const { pets, feedingLogs, hydrationLogs, vitals, alerts, showToast } = useAppContext();

  const [ownerEmail, setOwnerEmail] = useState<string>(() => {
    return localStorage.getItem('hn_owner_email')?.trim().toLowerCase() || '';
  });
  const [isAuthed, setIsAuthed] = useState<boolean>(() => {
    return !!localStorage.getItem('hn_owner_email');
  });

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<OwnerTab>('monitoring');

  // Selected pet focus (ID)
  const [selectedPetId, setSelectedPetId] = useState<string>('all');

  // Owner Home Notes local state
  const [ownerNotes, setOwnerNotes] = useState<OwnerHomeNote[]>(() => {
    try {
      const saved = localStorage.getItem('hn_owner_notes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [newNoteText, setNewNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // ─── Owner Data Scoping (Exclusive to Logged-in Owner) ────────────────
  const currentOwner = useMemo(() => {
    return (owners || []).find(
      (o) => o.email.trim().toLowerCase() === ownerEmail.toLowerCase()
    );
  }, [owners, ownerEmail]);

  // All pets belonging to this owner
  const myPets = useMemo(() => {
    if (!currentOwner) return [];
    const ownerNameLower = currentOwner.name.trim().toLowerCase();
    const ownerPetIds = currentOwner.petIds || [];

    return (pets || []).filter(
      (p) =>
        p.ownerId === currentOwner.id ||
        (p.ownerName && p.ownerName.trim().toLowerCase() === ownerNameLower) ||
        ownerPetIds.includes(p.id)
    );
  }, [pets, currentOwner]);

  // All sessions belonging to this owner
  const mySessions = useMemo(() => {
    if (!currentOwner) return [];
    return (sessions || []).filter(
      (s) =>
        s.ownerId === currentOwner.id ||
        (s.ownerEmail && s.ownerEmail.trim().toLowerCase() === ownerEmail.toLowerCase())
    );
  }, [sessions, currentOwner, ownerEmail]);

  // Active session for this owner
  const myActiveSession = useMemo(() => {
    return mySessions.find((s) => s.status === 'active') || null;
  }, [mySessions]);

  // Currently focused pet
  const focusedPet = useMemo(() => {
    if (selectedPetId !== 'all') {
      return myPets.find((p) => p.id === selectedPetId) || myPets[0] || null;
    }
    if (myActiveSession) {
      return myPets.find((p) => p.id === myActiveSession.petId) || myPets[0] || null;
    }
    return myPets[0] || null;
  }, [myPets, selectedPetId, myActiveSession]);

  // Scoped Logs for Owner's Pets
  const myPetIdsSet = useMemo(() => new Set(myPets.map((p) => p.id)), [myPets]);

  const myFeedingLogs = useMemo(() => {
    return (feedingLogs || []).filter(
      (f) =>
        myPetIdsSet.has(f.petId) ||
        (myActiveSession && f.sessionId === myActiveSession.id)
    );
  }, [feedingLogs, myPetIdsSet, myActiveSession]);

  const myHydrationLogs = useMemo(() => {
    return (hydrationLogs || []).filter(
      (h) =>
        myPetIdsSet.has(h.petId) ||
        (myActiveSession && h.sessionId === myActiveSession.id)
    );
  }, [hydrationLogs, myPetIdsSet, myActiveSession]);

  const myVitals = useMemo(() => {
    return (vitals || []).filter(
      (v) =>
        myPetIdsSet.has(v.petId) ||
        (myActiveSession && v.sessionId === myActiveSession.id)
    );
  }, [vitals, myPetIdsSet, myActiveSession]);

  const myAlerts = useMemo(() => {
    return (alerts || []).filter(
      (a) =>
        myPetIdsSet.has(a.petId) ||
        (myActiveSession && a.sessionId === myActiveSession.id)
    );
  }, [alerts, myPetIdsSet, myActiveSession]);

  // Live session elapsed calculation
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    if (!myActiveSession) return;
    const calc = () => {
      const start = new Date(myActiveSession.startTime).getTime();
      const diff = Date.now() - start;
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      return d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m` : `${m}m`;
    };
    setElapsed(calc());
    const t = setInterval(() => setElapsed(calc()), 60000);
    return () => clearInterval(t);
  }, [myActiveSession]);

  const isOnline = hardware.status === 'Online';

  const handleLogout = () => {
    localStorage.removeItem('hn_owner_email');
    setOwnerEmail('');
    setIsAuthed(false);
    showToast('info', 'LOGGED OUT', 'You have been logged out of the Pet Owner Portal.');
    navigate('/', { replace: true });
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const note: OwnerHomeNote = {
      id: `NOTE-${Date.now()}`,
      petName: focusedPet?.name || 'My Pet',
      timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      noteText: newNoteText.trim(),
    };

    const updated = [note, ...ownerNotes];
    setOwnerNotes(updated);
    localStorage.setItem('hn_owner_notes', JSON.stringify(updated));
    setNewNoteText('');
    setIsAddingNote(false);
    showToast('success', 'NOTE SAVED', 'Pet care note recorded successfully.');
  };

  // ─── Redirect if Not Authenticated ─────────────────────────────────────
  if (!isAuthed) {
    return <Navigate to="/owner/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Owner Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" iconOnly={false} />
            <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-extrabold border border-teal-200 uppercase tracking-wider hidden sm:inline">
              PET OWNER PORTAL
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-slate-800 block">
                {currentOwner?.name || ownerEmail}
              </span>
              <span className="text-[10px] text-slate-500 block font-medium">
                {currentOwner?.email || ownerEmail}
              </span>
            </div>

            {myActiveSession ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200 flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                CLINIC LIVE
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                REGISTERED OWNER
              </span>
            )}

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
              title="Sign Out of Portal"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-bold hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Owner Navigation Tabs */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar">
          <nav className="flex items-center gap-2 sm:gap-4 py-2">
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'monitoring'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Activity className="w-4 h-4" />
              Live Telemetry
            </button>

            <button
              onClick={() => setActiveTab('pets')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'pets'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Dog className="w-4 h-4" />
              My Pets ({myPets.length})
            </button>

            <button
              onClick={() => setActiveTab('intake')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'intake'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Utensils className="w-4 h-4" />
              Intake History ({myFeedingLogs.length + myHydrationLogs.length})
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'alerts'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Health Alerts ({myAlerts.length})
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4" />
              Sessions ({mySessions.length})
            </button>
          </nav>

          {/* Pet Switcher Dropdown if owner has multiple pets */}
          {myPets.length > 1 && (
            <div className="flex items-center gap-2 py-2">
              <span className="text-xs font-bold text-slate-500 hidden md:inline">Pet Focus:</span>
              <select
                value={selectedPetId}
                onChange={(e) => setSelectedPetId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-teal-500"
              >
                <option value="all">All Pets ({myPets.length})</option>
                {myPets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.species})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 flex-1 animate-fade-in">
        {/* Banner Welcome Card */}
        <div className="clinic-card p-6 bg-gradient-to-r from-teal-800 via-teal-700 to-sky-800 text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-300" />
                <h1 className="text-2xl font-extrabold tracking-tight">
                  Welcome, {currentOwner?.name || 'Pet Owner'}!
                </h1>
              </div>
              <p className="text-xs text-teal-100 leading-relaxed max-w-xl">
                Heritage Animal Clinic Pet Owner Dashboard. Real-time telemetry monitoring, dietary logs, and health updates strictly for your pets.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAddingNote(true)}
                className="px-4 py-2.5 rounded-xl bg-white text-teal-800 font-extrabold text-xs shadow-md hover:bg-teal-50 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-teal-600" />
                Log Home Note
              </button>
            </div>
          </div>
        </div>

        {/* ─── TAB 1: LIVE MONITORING TELEMETRY ──────────────────────────── */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            {myActiveSession ? (
              <div className="clinic-card overflow-hidden">
                <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-sky-700 p-6">
                  <div className="flex items-center gap-5">
                    <img
                      src={myActiveSession.petAvatarUrl || focusedPet?.avatarUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200'}
                      alt={myActiveSession.petName}
                      className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/20 shadow-lg"
                    />
                    <div className="text-white space-y-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-extrabold tracking-tight">{myActiveSession.petName}</h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-emerald-950 text-[10px] font-extrabold uppercase">
                          IN CLINIC WARD
                        </span>
                      </div>
                      <p className="text-teal-100 text-xs font-medium">
                        {myActiveSession.petSpecies} • {myActiveSession.petBreed} • {myActiveSession.petSnapshot?.weight}kg
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-teal-200 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Admitted {new Date(myActiveSession.admissionDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Session Elapsed: {elapsed}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-white">
                  <div>
                    <span className="text-slate-400 block font-bold uppercase text-[10px]">Expected Release</span>
                    <span className="font-extrabold text-slate-800 text-sm">
                      {new Date(myActiveSession.expectedReleaseDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold uppercase text-[10px]">Feeding Plan</span>
                    <span className="font-extrabold text-slate-800 text-sm">
                      {focusedPet?.feedingPlan.portionGrams || myActiveSession.petSnapshot?.feedingPlan.portionGrams}g × {focusedPet?.feedingPlan.timesPerDay || myActiveSession.petSnapshot?.feedingPlan.timesPerDay}/day
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold uppercase text-[10px]">Hydration Target</span>
                    <span className="font-extrabold text-slate-800 text-sm">
                      {focusedPet?.hydrationTarget || myActiveSession.petSnapshot?.hydrationTarget} ml/day
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold uppercase text-[10px]">Hardware Link</span>
                    <span className={`font-extrabold text-sm ${isOnline ? 'text-emerald-600' : 'text-rose-600'} flex items-center gap-1`}>
                      {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                      {hardware.status}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="clinic-card p-6 bg-slate-50 border-dashed border-2 border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">No Active Clinic Admission</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Your registered pets are currently enjoying home care. When admitted to Heritage Animal Clinic for ward monitoring, live hardware telemetry will appear here automatically.
                </p>
              </div>
            )}

            {/* Real-Time Live Pet Camera Stream */}
            <LiveCameraWidget
              title={`${myActiveSession?.petName || focusedPet?.name || 'Pet'} Live Clinic Cam`}
              subtitle="Live Video Feed & Bowl Stream"
            />

            {/* Gauges & Telemetry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="clinic-card p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Utensils className="w-4 h-4 text-orange-500" /> Food Reservoir
                  </span>
                  <span className="text-sm font-extrabold text-slate-900">{hardware.foodLevelPct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      hardware.foodLevelPct > 30 ? 'bg-gradient-to-r from-orange-400 to-amber-400' : 'bg-rose-500'
                    }`}
                    style={{ width: `${hardware.foodLevelPct}%` }}
                  />
                </div>
              </div>

              <div className="clinic-card p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Droplets className="w-4 h-4 text-sky-500" /> Water Reservoir
                  </span>
                  <span className="text-sm font-extrabold text-slate-900">{hardware.waterLevelPct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      hardware.waterLevelPct > 30 ? 'bg-gradient-to-r from-sky-400 to-blue-400' : 'bg-rose-500'
                    }`}
                    style={{ width: `${hardware.waterLevelPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Recent Intake Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="clinic-card p-5 bg-white space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-orange-500" />
                  Recent Feeding Activity
                </h3>
                <div className="space-y-2">
                  {myFeedingLogs.length > 0 ? (
                    myFeedingLogs.slice(0, 5).map((f) => (
                      <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div>
                          <span className="font-extrabold text-slate-800">{f.petName}: {f.portionGrams}g</span>
                          <span className="text-slate-400 ml-2 font-medium">{f.dispensedAt}</span>
                        </div>
                        <StatusBadge status={f.status} size="sm" />
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-6 font-medium">
                      No feeding records found for your pets.
                    </p>
                  )}
                </div>
              </div>

              <div className="clinic-card p-5 bg-white space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-sky-500" />
                  Recent Hydration Activity
                </h3>
                <div className="space-y-2">
                  {myHydrationLogs.length > 0 ? (
                    myHydrationLogs.slice(0, 5).map((h) => (
                      <div key={h.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div>
                          <span className="font-extrabold text-slate-800">{h.petName}: {h.amountMl}ml</span>
                          <span className="text-slate-400 ml-2 font-medium">{h.timestamp}</span>
                        </div>
                        <span className="text-slate-500 font-semibold">Reservoir: {h.reservoirLevelPct}%</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-6 font-medium">
                      No hydration records found for your pets.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: MY REGISTERED PETS ─────────────────────────────────── */}
        {activeTab === 'pets' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">My Registered Pets</h2>
                <p className="text-xs text-slate-500">Pets linked to owner account {currentOwner?.email}.</p>
              </div>
            </div>

            {myPets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myPets.map((pet) => (
                  <div key={pet.id} className="clinic-card overflow-hidden bg-white hover:border-teal-300 transition-all">
                    <div className="p-5 flex items-start gap-4">
                      <img
                        src={pet.avatarUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200'}
                        alt={pet.name}
                        className="w-16 h-16 rounded-2xl object-cover ring-2 ring-teal-500/20"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-extrabold text-slate-900">{pet.name}</h3>
                          <StatusBadge status={pet.healthStatus} size="sm" />
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          {pet.species} • {pet.breed} • {pet.age} years old
                        </p>
                        <p className="text-xs text-slate-600 font-semibold pt-1">
                          Weight: {pet.weight} kg | Diet: {pet.feedingPlan.foodType || 'Standard'}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Daily Meal Portion</span>
                        <span className="font-extrabold text-slate-800">{pet.feedingPlan.portionGrams}g × {pet.feedingPlan.timesPerDay}/day</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Hydration Target</span>
                        <span className="font-extrabold text-sky-700">{pet.hydrationTarget} ml/day</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="clinic-card p-10 bg-white text-center space-y-3">
                <Dog className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-extrabold text-slate-800">No Pets Linked to Your Owner Profile</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Your owner ID is <strong className="text-teal-700">{currentOwner?.id}</strong>. Please provide this ID to Heritage Animal Clinic staff when admitting your pet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: INTAKE & HYDRATION HISTORY ─────────────────────────── */}
        {activeTab === 'intake' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Intake & Consumption Logs</h2>
              <p className="text-xs text-slate-500">Historical food and water logs for your registered pets.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Feeding Table */}
              <div className="clinic-card p-5 bg-white space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-orange-500" /> Feeding Records ({myFeedingLogs.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] font-extrabold">
                        <th className="py-2.5 px-2">Pet</th>
                        <th className="py-2.5 px-2">Portion</th>
                        <th className="py-2.5 px-2">Time</th>
                        <th className="py-2.5 px-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myFeedingLogs.length > 0 ? (
                        myFeedingLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-2 font-extrabold text-slate-800">{log.petName}</td>
                            <td className="py-2.5 px-2 font-bold text-slate-700">{log.portionGrams}g</td>
                            <td className="py-2.5 px-2 text-slate-500">{log.dispensedAt}</td>
                            <td className="py-2.5 px-2 text-right">
                              <StatusBadge status={log.status} size="sm" />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400 font-medium">No feeding records.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Hydration Table */}
              <div className="clinic-card p-5 bg-white space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-sky-500" /> Hydration Records ({myHydrationLogs.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] font-extrabold">
                        <th className="py-2.5 px-2">Pet</th>
                        <th className="py-2.5 px-2">Volume</th>
                        <th className="py-2.5 px-2">Timestamp</th>
                        <th className="py-2.5 px-2 text-right">Reservoir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myHydrationLogs.length > 0 ? (
                        myHydrationLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-2 font-extrabold text-slate-800">{log.petName}</td>
                            <td className="py-2.5 px-2 font-extrabold text-sky-700">{log.amountMl}ml</td>
                            <td className="py-2.5 px-2 text-slate-500">{log.timestamp}</td>
                            <td className="py-2.5 px-2 text-right font-bold text-slate-700">{log.reservoirLevelPct}%</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400 font-medium">No hydration records.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 4: HEALTH ALERTS & NOTES ─────────────────────────────── */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Health Alerts & Observations</h2>
              <p className="text-xs text-slate-500">AI anomalies and clinical health alerts for your pets.</p>
            </div>

            {myAlerts.length > 0 ? (
              <div className="space-y-4">
                {myAlerts.map((alert) => (
                  <div key={alert.id} className="clinic-card p-5 bg-white space-y-2 border-l-4 border-l-amber-500">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-500" />
                        {alert.petName}: {alert.alertType}
                      </span>
                      <StatusBadge status={alert.severity} size="sm" />
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{alert.aiObservation}</p>
                    <p className="text-xs text-teal-800 font-bold">Recommended Action: {alert.recommendedAction}</p>
                    <span className="text-[10px] text-slate-400 block pt-1">{alert.timestamp}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="clinic-card p-8 bg-white text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                <h3 className="text-sm font-extrabold text-slate-800">No Active Health Alerts</h3>
                <p className="text-xs text-slate-500">Your pets currently have no flagged health alerts.</p>
              </div>
            )}

            {/* Owner Care Notes */}
            <div className="clinic-card p-5 bg-white space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-teal-600" />
                  Owner Care Notes ({ownerNotes.length})
                </h3>
                <button
                  onClick={() => setIsAddingNote(true)}
                  className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold hover:bg-teal-100 transition-colors"
                >
                  + Add Note
                </button>
              </div>

              {ownerNotes.length > 0 ? (
                <div className="space-y-3">
                  {ownerNotes.map((note) => (
                    <div key={note.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-800">{note.petName}</span>
                        <span className="text-[10px] text-slate-400">{note.timestamp}</span>
                      </div>
                      <p className="text-slate-600 font-medium">{note.noteText}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No home care notes recorded yet.</p>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 5: SESSION HISTORY ────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Clinic Session Archive</h2>
              <p className="text-xs text-slate-500">History of clinic monitoring sessions for your pets.</p>
            </div>

            {mySessions.length > 0 ? (
              <div className="space-y-4">
                {mySessions.map((session) => (
                  <div key={session.id} className="clinic-card p-5 bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={session.petAvatarUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200'}
                          alt={session.petName}
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900">{session.petName} ({session.petSpecies})</h3>
                          <span className="text-[10px] text-slate-400">Session ID: {session.id}</span>
                        </div>
                      </div>
                      <StatusBadge status={session.status} size="sm" />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Admitted</span>
                        <span className="font-bold text-slate-700">{new Date(session.admissionDate).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Expected Release</span>
                        <span className="font-bold text-slate-700">{new Date(session.expectedReleaseDate).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Release Condition</span>
                        <span className="font-bold text-teal-800">{session.releaseCondition || 'In Care'}</span>
                      </div>
                    </div>

                    {session.finalNotes && (
                      <p className="text-xs text-slate-600 bg-teal-50/50 p-3 rounded-xl border border-teal-100 font-medium">
                        <strong>Veterinary Release Notes:</strong> {session.finalNotes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="clinic-card p-8 bg-white text-center space-y-2">
                <History className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-extrabold text-slate-800">No Past Sessions Recorded</h3>
                <p className="text-xs text-slate-500">Your pets have no completed clinic admission sessions yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Heritage Animal Clinic Contact Footer */}
        <div className="clinic-card p-5 bg-white border-t border-slate-200 mt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
              <span><strong>Heritage Animal Clinic:</strong> Main Highway Ward Facility</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-teal-600" /> +63 917 123 4567</span>
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-teal-600" /> clinic@heritageanimal.com</span>
            </div>
          </div>
        </div>
      </main>

      {/* Log Home Care Note Modal */}
      {isAddingNote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-fade-in">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-teal-600" />
              Record Home Care Note
            </h3>
            <p className="text-xs text-slate-500">
              Log a note regarding {focusedPet?.name || 'your pet'}'s meal or behavior.
            </p>

            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                rows={3}
                required
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="e.g. Ate 80g of food and drank plenty of water after walk."
                className="w-full p-3 text-xs font-medium rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNote(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-md hover:bg-teal-700 transition-colors cursor-pointer"
                >
                  Save Care Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

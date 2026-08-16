/**
 * HydroNourish — Owner Dashboard Page (Dynamic, Realtime & Photo Upload)
 * Heritage Animal Clinic Capstone Project
 *
 * Dedicated, fully-functional monitoring portal for registered pet owners.
 * Exclusively scoped to the logged-in owner's pets, intake records, vitals, and monitoring sessions.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from '../contexts/SessionContext';
import { useAppContext } from '../hooks/useAppContext';
import { StatusBadge } from '../components/StatusBadge';
import { Logo } from '../components/Logo';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LiveCameraWidget } from '../components/LiveCameraWidget';
import {
  Dog,
  Cat,
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
  Plus,
  FileText,
  History,
  Dog,
  Cat,
  LogOut,
  Sparkles,
  Camera,
  CheckCircle2,
  Trash2,
  Edit3,
  Clock,
  Zap,
  Image as ImageIcon,
  Upload,
  User,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  MessageSquare,
  Send,
  Inbox,
  Reply,
  MessageCircle,
} from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { compressImageFile } from '../utils/imageCompressor';

type OwnerTab = 'monitoring' | 'pets' | 'intake' | 'sessions' | 'messages';

export const OwnerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeSession, sessions, hardware, owners, addOwner, updateOwner } = useSession();
  const {
    pets,
    addPet,
    updatePet,
    deletePet,
    feedingLogs,
    hydrationLogs,
    alerts,
    inquiries,
    addInquiry,
    sendOwnerFollowUpMessage,
    showToast,
  } = useAppContext();

  const [ownerEmail, setOwnerEmail] = useState<string>(() => {
    return localStorage.getItem('hn_owner_email')?.trim().toLowerCase() || '';
  });
  const [isAuthed, setIsAuthed] = useState<boolean>(() => {
    return !!localStorage.getItem('hn_owner_email');
  });

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<OwnerTab>('pets');

  // Modals
  const [addPetModalOpen, setAddPetModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<any | null>(null);
  const [deletePetTarget, setDeletePetTarget] = useState<any | null>(null);

  // File input ref
  const addFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Pet Form State with Avatar URL
  const [petForm, setPetForm] = useState({
    name: '',
    species: 'Dog' as 'Dog' | 'Cat' | 'Other',
    breed: '',
    age: 2,
    weight: 8,
    sex: 'Male' as 'Male' | 'Female',
    notes: '',
    portionGrams: 120,
    timesPerDay: 2,
    foodType: 'High-Protein Recipe',
    hydrationTarget: 500,
    avatarUrl: '',
  });

  // ─── DYNAMIC OWNER RESOLUTION ───────────────────────────────────────
  const matchingOwners = useMemo(() => {
    const emailLower = ownerEmail.trim().toLowerCase();
    if (!emailLower) return [];
    return (owners || []).filter((o) => {
      if (!o) return false;
      const oEmail = o.email?.trim().toLowerCase();
      const oName = o.name?.trim().toLowerCase();
      return (
        (oEmail && oEmail === emailLower) ||
        (oEmail && emailLower && (oEmail.includes(emailLower) || emailLower.includes(oEmail))) ||
        (oName && emailLower && emailLower.startsWith(oName.replace(/\s+/g, '')))
      );
    });
  }, [owners, ownerEmail]);

  const currentOwner = useMemo(() => {
    if (matchingOwners.length > 0) return matchingOwners[0];

    const nameFromEmail = ownerEmail.split('@')[0] || 'Pet Owner';
    const capitalized = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
    return {
      id: 'OWN-' + Math.abs(ownerEmail.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0) % 1000).toString().padStart(3, '0'),
      name: capitalized,
      email: ownerEmail,
      phone: '+63 917 555 0192',
      accessStatus: 'active' as const,
      petIds: [],
      currentSessionId: null,
      dateCreated: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
  }, [matchingOwners, ownerEmail]);

  // Auto-register owner in session context if not present
  useEffect(() => {
    if (ownerEmail && !(owners || []).some((o) => o.email.trim().toLowerCase() === ownerEmail.toLowerCase())) {
      addOwner({
        name: currentOwner.name,
        email: ownerEmail,
        phone: currentOwner.phone,
        address: 'Metro Manila, Philippines',
        petIds: [],
      });
    }
  }, [ownerEmail, owners, currentOwner, addOwner]);

  // Live presence heartbeat for realtime online status
  useEffect(() => {
    if (!ownerEmail) return;
    const emailClean = ownerEmail.trim().toLowerCase();
    const touchPresence = () => {
      localStorage.setItem('hn_owner_last_active_' + emailClean, Date.now().toString());
      if (currentOwner?.id) {
        updateOwner(currentOwner.id, { lastLogin: new Date().toISOString() });
      }
    };
    touchPresence();
    const interval = setInterval(touchPresence, 20000); // 20s heartbeat
    return () => clearInterval(interval);
  }, [ownerEmail, currentOwner?.id, updateOwner]);

  // ─── DYNAMIC PETS SCOPING ───────────────────────────────────────────
  const myPets = useMemo(() => {
    if (!ownerEmail && !currentOwner) return [];
    const emailClean = ownerEmail.trim().toLowerCase();
    const ownerNameClean = currentOwner?.name?.trim().toLowerCase() || '';
    const ownerCleanSimple = ownerNameClean.replace(/[^a-z0-9]/g, '');
    const ownerPhoneDigits = currentOwner?.phone ? currentOwner.phone.replace(/\D/g, '') : '';

    // Collect all pet IDs explicitly assigned to any matching owner record or session
    const linkedPetIds = new Set<string>();
    matchingOwners.forEach((mo) => {
      (mo.petIds || []).forEach((pid) => linkedPetIds.add(pid));
    });
    (currentOwner?.petIds || []).forEach((pid) => linkedPetIds.add(pid));

    (sessions || []).forEach((s) => {
      const sOwnerEmail = s.ownerEmail?.trim().toLowerCase();
      if (
        (sOwnerEmail && (sOwnerEmail === emailClean || emailClean.includes(sOwnerEmail) || sOwnerEmail.includes(emailClean))) ||
        (s.ownerId && (s.ownerId === currentOwner?.id || matchingOwners.some((m) => m.id === s.ownerId)))
      ) {
        if (s.petId) linkedPetIds.add(s.petId);
      }
    });

    return (pets || []).filter((p) => {
      if (!p) return false;
      const petOwnerId = p.ownerId;
      const petOwnerName = p.ownerName?.trim().toLowerCase() || '';
      const petOwnerCleanSimple = petOwnerName.replace(/[^a-z0-9]/g, '');
      const petOwnerEmail = p.ownerEmail?.trim().toLowerCase() || '';
      const petOwnerPhoneDigits = p.ownerPhone ? p.ownerPhone.replace(/\D/g, '') : '';

      return (
        linkedPetIds.has(p.id) ||
        (petOwnerId && (petOwnerId === currentOwner?.id || matchingOwners.some((m) => m.id === petOwnerId))) ||
        (petOwnerEmail && (petOwnerEmail === emailClean || emailClean.includes(petOwnerEmail) || petOwnerEmail.includes(emailClean))) ||
        (petOwnerName && ownerNameClean && (
          petOwnerName === ownerNameClean ||
          petOwnerCleanSimple === ownerCleanSimple ||
          (ownerCleanSimple.length >= 3 && petOwnerCleanSimple.includes(ownerCleanSimple)) ||
          (petOwnerCleanSimple.length >= 3 && ownerCleanSimple.includes(petOwnerCleanSimple))
        )) ||
        (emailClean && petOwnerCleanSimple && (emailClean.includes(petOwnerCleanSimple) || petOwnerCleanSimple.includes(emailClean.split('@')[0]))) ||
        (petOwnerPhoneDigits && ownerPhoneDigits && petOwnerPhoneDigits.length >= 7 && petOwnerPhoneDigits === ownerPhoneDigits)
      );
    });
  }, [pets, currentOwner, ownerEmail, matchingOwners, sessions]);

  // Dynamic Feeding & Hydration Logs Scoping
  const myPetIds = useMemo(() => myPets.map((p) => p.id), [myPets]);
  const myFeedingLogs = useMemo(() => {
    return (feedingLogs || []).filter((f) => myPetIds.includes(f.petId));
  }, [feedingLogs, myPetIds]);

  const myHydrationLogs = useMemo(() => {
    return (hydrationLogs || []).filter((h) => myPetIds.includes(h.petId));
  }, [hydrationLogs, myPetIds]);

  // Dynamic Sessions Scoping
  const mySessions = useMemo(() => {
    return (sessions || []).filter(
      (s) =>
        s.ownerEmail?.toLowerCase() === ownerEmail.toLowerCase() ||
        s.ownerId === currentOwner?.id ||
        myPetIds.includes(s.petId)
    );
  }, [sessions, ownerEmail, currentOwner, myPetIds]);

  // Scoped inquiries/messages sent by this owner
  const myInquiries = useMemo(() => {
    if (!ownerEmail) return [];
    const emailClean = ownerEmail.trim().toLowerCase();
    return (inquiries || []).filter((inq) => {
      if (!inq) return false;
      const inqEmail = inq.email?.trim().toLowerCase();
      return inqEmail === emailClean || (inqEmail && (inqEmail.includes(emailClean) || emailClean.includes(inqEmail)));
    });
  }, [inquiries, ownerEmail]);

  // Message Clinic & Chat State
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  const [isStartingNewTopic, setIsStartingNewTopic] = useState(false);
  const [chatInputText, setChatInputText] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  const [messageSubject, setMessageSubject] = useState('General Veterinary Consultation');
  const [messagePetId, setMessagePetId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Currently active selected inquiry for the chatbox
  const activeInquiry = useMemo(() => {
    if (selectedInquiryId) {
      return myInquiries.find((i) => i.id === selectedInquiryId) || myInquiries[0] || null;
    }
    return myInquiries[0] || null;
  }, [myInquiries, selectedInquiryId]);

  const handleSendMessageToClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) {
      showToast('warning', 'Message Required', 'Please enter your message or question for the clinic staff.');
      return;
    }

    const selectedPet = myPets.find((p) => p.id === messagePetId);
    const petTag = selectedPet ? `[${selectedPet.name} (${selectedPet.species})] ` : `[${myPets[0]?.name || 'Registered Patient'}] `;
    const finalSubject = `${petTag}${messageSubject.trim() || 'Health Inquiry'}`;

    try {
      setIsSendingMessage(true);
      await addInquiry({
        name: currentOwner.name,
        email: ownerEmail,
        phone: currentOwner.phone,
        subject: finalSubject,
        message: messageText.trim(),
      });
      setMessageText('');
      setIsStartingNewTopic(false);
      showToast('success', 'Message Dispatched', 'Your consultation topic has been started. You can now chat in real-time below.');
    } catch {
      showToast('error', 'Message Failed', 'Could not send message. Please try again.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSendOwnerChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInputText.trim() || !activeInquiry) return;

    const textToSend = chatInputText.trim();
    setIsSendingChat(true);
    try {
      await sendOwnerFollowUpMessage(activeInquiry.id, textToSend, currentOwner?.name || 'Pet Owner');
      setChatInputText('');
      showToast('success', 'Message Sent', 'Your message has been delivered to clinic staff.');
    } catch {
      showToast('error', 'Send Failed', 'Could not send message. Please try again.');
    } finally {
      setIsSendingChat(false);
    }
  };

  // Handle Image File Selection
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 400, 400, 0.8);
        setPetForm((prev) => ({ ...prev, avatarUrl: compressed }));
        showToast('info', 'PHOTO ATTACHED', 'Pet picture loaded and optimized.');
      } catch {
        showToast('warning', 'IMAGE ERROR', 'Could not process image file.');
      }
    }
  };

  const handleAddPetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petForm.name.trim()) return;

    const defaultAvatar = petForm.species === 'Cat'
      ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=300'
      : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300';

    const createdPet = await addPet({
      name: petForm.name.trim(),
      species: petForm.species,
      breed: petForm.breed.trim() || (petForm.species === 'Cat' ? 'Domestic Shorthair' : 'Mixed Breed'),
      age: Number(petForm.age) || 2,
      weight: Number(petForm.weight) || 8,
      sex: petForm.sex,
      ownerName: currentOwner.name,
      ownerPhone: currentOwner.phone,
      ownerEmail: ownerEmail,
      ownerId: currentOwner.id,
      clinicRef: 'REF-2026-' + Math.floor(100 + Math.random() * 800),
      assignedDeviceId: 'HN-NODE-F778',
      healthStatus: 'Healthy',
      avatarUrl: petForm.avatarUrl || defaultAvatar,
      feedingPlan: {
        portionGrams: Number(petForm.portionGrams) || 120,
        timesPerDay: Number(petForm.timesPerDay) || 2,
        foodType: petForm.foodType,
      },
      hydrationTarget: Number(petForm.hydrationTarget) || 500,
      latestVitals: {
        temperature: 38.5,
        heartRate: 95,
        activityLevel: 'Normal',
        lastMeasured: 'Just registered',
      },
      notes: petForm.notes || 'Registered by pet owner in portal.',
    });

    if (currentOwner?.id) {
      updateOwner(currentOwner.id, {
        petIds: Array.from(new Set([...(currentOwner.petIds || []), createdPet.id])),
      });
    }

    showToast('success', 'PET REGISTERED', petForm.name + ' was successfully added with photo.');
    setAddPetModalOpen(false);
    setPetForm({
      name: '',
      species: 'Dog',
      breed: '',
      age: 2,
      weight: 8,
      sex: 'Male',
      notes: '',
      portionGrams: 120,
      timesPerDay: 2,
      foodType: 'High-Protein Recipe',
      hydrationTarget: 500,
      avatarUrl: '',
    });
  };

  const handleOpenEdit = (pet: any) => {
    setEditingPet(pet);
    setPetForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || '',
      age: pet.age || 2,
      weight: pet.weight || 8,
      sex: (pet.sex as any) || 'Male',
      notes: pet.notes || '',
      portionGrams: pet.feedingPlan?.portionGrams || 120,
      timesPerDay: pet.feedingPlan?.timesPerDay || 2,
      foodType: pet.feedingPlan?.foodType || 'High-Protein Recipe',
      hydrationTarget: pet.hydrationTarget || 500,
      avatarUrl: pet.avatarUrl || '',
    });
  };

  const handleSavePetEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPet) return;

    updatePet(editingPet.id, {
      name: petForm.name,
      species: petForm.species,
      breed: petForm.breed,
      age: Number(petForm.age),
      weight: Number(petForm.weight),
      sex: petForm.sex,
      notes: petForm.notes,
      avatarUrl: petForm.avatarUrl || editingPet.avatarUrl,
      feedingPlan: {
        portionGrams: Number(petForm.portionGrams) || 120,
        timesPerDay: Number(petForm.timesPerDay) || 2,
        foodType: petForm.foodType,
      },
      hydrationTarget: Number(petForm.hydrationTarget) || 500,
    });

    showToast('success', 'PET UPDATED', petForm.name + "'s profile and picture have been updated.");
    setEditingPet(null);
  };

  const handleSignOut = () => {
    localStorage.removeItem('hn_owner_email');
    setIsAuthed(false);
    navigate('/owner/login', { replace: true });
  };

  if (!isAuthed || !ownerEmail) {
    return <Navigate to="/owner/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-extrabold uppercase tracking-wider hidden sm:inline-block">
              Pet Owner Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">{currentOwner?.name || 'Pet Owner'}</p>
              <p className="text-[10px] text-slate-400 font-mono">{ownerEmail}</p>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 text-[10px] font-extrabold uppercase">
              Registered Owner
            </span>
            <button
              onClick={handleSignOut}
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 overflow-x-auto border-t border-slate-100 py-2">
          {[
            { id: 'pets', label: 'My Pets (' + myPets.length + ')', icon: Dog },
            { id: 'monitoring', label: 'Live Telemetry', icon: Activity },
            { id: 'intake', label: 'Intake History (' + (myFeedingLogs.length + myHydrationLogs.length) + ')', icon: Utensils },
            { id: 'sessions', label: 'Sessions (' + mySessions.length + ')', icon: Calendar },
            { id: 'messages', label: 'Message Clinic (' + myInquiries.length + ')', icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Welcome Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-300" />
              <h2 className="text-lg sm:text-xl font-black">Welcome, {currentOwner?.name}!</h2>
            </div>
            <p className="text-xs text-teal-100/80">
              Heritage Animal Clinic Pet Owner Dashboard. Real-time telemetry monitoring, dietary logs, and health updates strictly for your pets.
            </p>
          </div>
          <div className="flex items-center gap-2 relative z-10 shrink-0">
            <button
              onClick={() => setActiveTab('messages')}
              className="px-4 py-2.5 rounded-xl bg-teal-500/30 hover:bg-teal-500/40 text-teal-200 border border-teal-400/40 font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-teal-300" />
              Message Clinic Staff
            </button>
            <button
              onClick={() => {
                setPetForm({
                  name: '',
                  species: 'Dog',
                  breed: '',
                  age: 2,
                  weight: 8,
                  sex: 'Male',
                  notes: '',
                  portionGrams: 120,
                  timesPerDay: 2,
                  foodType: 'High-Protein Recipe',
                  hydrationTarget: 500,
                  avatarUrl: '',
                });
                setAddPetModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Add My Pet
            </button>
          </div>
        </div>

        {/* ═══════════ TAB: MY PETS (WITH ADD, EDIT, AND PHOTO UPLOAD) ═══════════ */}
        {activeTab === 'pets' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">My Registered Pets ({myPets.length})</h2>
                <p className="text-xs text-slate-500">Manage and edit your pets linked to {ownerEmail}.</p>
              </div>
              <button
                onClick={() => {
                  setPetForm({
                    name: '',
                    species: 'Dog',
                    breed: '',
                    age: 2,
                    weight: 8,
                    sex: 'Male',
                    notes: '',
                    portionGrams: 120,
                    timesPerDay: 2,
                    foodType: 'High-Protein Recipe',
                    hydrationTarget: 500,
                    avatarUrl: '',
                  });
                  setAddPetModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" /> + Register Pet
              </button>
            </div>

            {myPets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myPets.map((pet) => (
                  <div key={pet.id} className="clinic-card overflow-hidden bg-white hover:border-teal-300 transition-all border border-slate-200/90 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="p-5 flex items-start gap-4">
                        <img
                          src={pet.avatarUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200'}
                          alt={pet.name}
                          className="w-18 h-18 rounded-2xl object-cover ring-2 ring-teal-500/30 shadow-xs shrink-0 border border-slate-200"
                        />
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-base font-extrabold text-slate-900 truncate">{pet.name}</h3>
                            <StatusBadge status={pet.healthStatus} size="sm" />
                          </div>
                          <p className="text-xs text-slate-500 font-medium">
                            {pet.species} • {pet.breed || 'Mixed Breed'} • {pet.age} years old
                          </p>
                          <p className="text-xs text-slate-600 font-semibold pt-0.5">
                            Weight: <strong className="text-slate-900">{pet.weight} kg</strong> | Gender: <strong className="text-slate-900">{pet.sex || 'Male'}</strong>
                          </p>
                          {pet.notes && (
                            <p className="text-[11px] text-slate-500 italic line-clamp-1 pt-0.5">Notes: {pet.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Daily Meal Portion</span>
                          <span className="font-extrabold text-slate-800">{pet.feedingPlan?.portionGrams || 100}g × {pet.feedingPlan?.timesPerDay || 2}/day</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Hydration Target</span>
                          <span className="font-extrabold text-slate-800">{pet.hydrationTarget || 500} ml/day</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-white gap-2">
                      <button
                        onClick={() => handleOpenEdit(pet)}
                        className="flex-1 py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-teal-200 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit Pet Details & Photo
                      </button>

                      <button
                        onClick={() => setDeletePetTarget(pet)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition-colors cursor-pointer border border-rose-200"
                        title="Delete Pet Profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="clinic-card p-12 text-center space-y-4 bg-white border-2 border-dashed border-teal-200 rounded-3xl shadow-sm">
                <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto shadow-xs">
                  <Dog className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-slate-900">No Pets Linked to Your Profile Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Click below to upload a picture and register your pet's profile to begin telemetry and intake monitoring.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setPetForm({
                        name: '',
                        species: 'Dog',
                        breed: '',
                        age: 2,
                        weight: 8,
                        sex: 'Male',
                        notes: '',
                        portionGrams: 120,
                        timesPerDay: 2,
                        foodType: 'High-Protein Recipe',
                        hydrationTarget: 500,
                        avatarUrl: '',
                      });
                      setAddPetModalOpen(true);
                    }}
                    className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-extrabold text-xs shadow-lg shadow-teal-600/20 inline-flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    + Add / Register My Pet Now
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ TAB: MONITORING / TELEMETRY ═══════════ */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <LiveCameraWidget isOnline={hardware.status === 'Online'} />
              </div>
              <div className="lg:col-span-5 clinic-card p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">Smart Feeder Station</h3>
                      <p className="text-[11px] text-slate-400 font-mono">ID: {hardware.id}</p>
                    </div>
                    <StatusBadge status={hardware.status} size="sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Food Reservoir</span>
                      <span className="text-lg font-black text-slate-900">{hardware.foodLevelPct}%</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Water Reservoir</span>
                      <span className="text-lg font-black text-slate-900">{hardware.waterLevelPct}%</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-xs text-teal-800 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>ESP32 Wi-Fi Signal: <strong>{hardware.wifiSignalDbm} dBm</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ TAB: INTAKE ═══════════ */}
        {activeTab === 'intake' && (
          <div className="clinic-card p-6 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Intake & Consumption Records</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {myFeedingLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Utensils className="w-4 h-4 text-orange-500" />
                    <div>
                      <p className="font-bold text-slate-900">{log.petName} Dispensed {log.portionGrams}g</p>
                      <p className="text-[10px] text-slate-400">{log.dispensedAt}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {log.status}
                  </span>
                </div>
              ))}
              {myFeedingLogs.length === 0 && (
                <p className="text-center py-6 text-slate-400 italic">No feeding intake records logged yet.</p>
              )}
            </div>
          </div>
        )}

        {/* ═══════════ TAB: SESSIONS ═══════════ */}
        {activeTab === 'sessions' && (
          <div className="clinic-card p-6 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Clinical Monitoring Sessions</h3>
            <div className="space-y-3">
              {mySessions.map((session) => (
                <div key={session.id} className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{session.petName} ({session.petSpecies})</p>
                    <p className="text-slate-500 text-[11px]">Admitted: {new Date(session.admissionDate).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={session.status} size="sm" />
                </div>
              ))}
              {mySessions.length === 0 && (
                <p className="text-center py-6 text-slate-400 italic">No clinical monitoring sessions on record.</p>
              )}
            </div>
          </div>
        )}

        {/* ═══════════ TAB: MESSAGES & CHATBOX TO CLINIC ═══════════ */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            {activeInquiry && !isStartingNewTopic ? (
              /* Unified Chatbox Window */
              <div className="clinic-card border border-teal-200/90 bg-white shadow-md overflow-hidden rounded-3xl flex flex-col">
                {/* 1. Chat Header */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-600 via-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md">
                        <svg viewBox="0 0 100 100" fill="none" className="w-7 h-7 text-white">
                          <path
                            d="M50 8 C50 8, 18 50, 18 66 A32 32 0 0 0 82 66 C82 50, 50 8, 50 8 Z"
                            fill="currentColor"
                            opacity="0.25"
                          />
                          <path
                            d="M50 12 C50 12, 22 52, 22 66 A28 28 0 0 0 78 66 C78 52, 50 12, 50 12 Z"
                            stroke="currentColor"
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <ellipse cx="50" cy="70" rx="12" ry="8.5" fill="currentColor" />
                          <circle cx="36" cy="55" r="4" fill="currentColor" />
                          <circle cx="45" cy="49" r="4.5" fill="currentColor" />
                          <circle cx="55" cy="49" r="4.5" fill="currentColor" />
                          <circle cx="64" cy="55" r="4" fill="currentColor" />
                        </svg>
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900" />
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-black text-white leading-tight">
                          Heritage Animal Clinic Staff
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold whitespace-nowrap">
                          🟢 Live Desk Online
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 truncate mt-0.5">
                        Direct Veterinary Consultation &amp; Telemetry Follow-ups
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {myInquiries.length > 1 && (
                      <select
                        value={activeInquiry.id}
                        onChange={(e) => setSelectedInquiryId(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                      >
                        {myInquiries.map((inq) => (
                          <option key={inq.id} value={inq.id}>
                            Topic: {inq.subject.slice(0, 35)}...
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      onClick={() => setIsStartingNewTopic(true)}
                      className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      New Topic
                    </button>
                  </div>
                </div>

                {/* 2. Details Summary Ribbon (Always Included!) */}
                <div className="bg-slate-100 border-b border-slate-200/80 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-slate-500 uppercase text-[10px]">Active Topic:</span>
                    <span className="font-extrabold text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/80">
                      {activeInquiry.subject}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        activeInquiry.status === 'replied'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : activeInquiry.status === 'unread'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {activeInquiry.status === 'replied'
                        ? '✓ Replied by Staff'
                        : activeInquiry.status === 'unread'
                        ? 'Pending Staff Review'
                        : activeInquiry.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                    <span>Started: <strong>{new Date(activeInquiry.createdAt).toLocaleString()}</strong></span>
                    <span className="font-mono">Ref: {activeInquiry.id}</span>
                  </div>
                </div>

                {(() => {
                  let threadMessages: ChatMessageItem[] = [];
                  if (activeInquiry.messagesThread && activeInquiry.messagesThread.length > 0) {
                    threadMessages = activeInquiry.messagesThread;
                  } else if (
                    activeInquiry.replyMessage &&
                    activeInquiry.replyMessage.trim().startsWith('[') &&
                    activeInquiry.replyMessage.trim().endsWith(']')
                  ) {
                    try {
                      const parsed = JSON.parse(activeInquiry.replyMessage.trim());
                      if (Array.isArray(parsed) && parsed.length > 0) {
                        threadMessages = parsed;
                      }
                    } catch {}
                  }

                  if (threadMessages.length === 0) {
                    if (activeInquiry.message) {
                      threadMessages.push({
                        id: `msg-1-${activeInquiry.id}`,
                        sender: 'owner' as const,
                        senderName: currentOwner.name || 'You',
                        message: activeInquiry.message,
                        timestamp: activeInquiry.createdAt,
                      });
                    }
                    if (activeInquiry.replyMessage && !activeInquiry.replyMessage.trim().startsWith('[')) {
                      threadMessages.push({
                        id: `msg-2-${activeInquiry.id}`,
                        sender: 'admin' as const,
                        senderName: 'Heritage Animal Clinic Staff',
                        message: activeInquiry.replyMessage,
                        timestamp: activeInquiry.repliedAt || activeInquiry.createdAt,
                      });
                    }
                  }

                  return (
                    <div className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/60 via-white to-slate-50/40 min-h-[350px] max-h-[500px]">
                      <div className="text-center my-1">
                        <span className="px-3 py-1 rounded-full bg-slate-200/80 text-slate-600 text-[10px] font-bold">
                          Consultation Thread Started • {new Date(activeInquiry.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {threadMessages.map((msg, idx) => {
                        const isOwner = msg.sender === 'owner';
                        return (
                          <div
                            key={msg.id || idx}
                            className={`flex flex-col ${isOwner ? 'items-end' : 'items-start'} space-y-1`}
                          >
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                              <span className="font-bold text-slate-600">
                                {isOwner ? 'You (' + currentOwner.name + ')' : 'Heritage Animal Clinic Staff'}
                              </span>
                              <span>• {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>

                            <div
                              className={`p-4 rounded-2xl text-xs leading-relaxed max-w-[85%] sm:max-w-lg whitespace-pre-wrap ${
                                isOwner
                                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-sm rounded-tr-xs font-medium'
                                  : 'bg-white text-slate-800 border border-emerald-200/90 shadow-2xs rounded-tl-xs ring-1 ring-emerald-500/10'
                              }`}
                            >
                              {!isOwner && (
                                <div className="text-[11px] font-extrabold text-emerald-800 flex items-center gap-1 mb-1 pb-1 border-b border-emerald-100">
                                  <Reply className="w-3.5 h-3.5 text-emerald-600" />
                                  Heritage Animal Clinic Response:
                                </div>
                              )}
                              {msg.message}
                            </div>

                            {isOwner && (
                              <div className="text-[10px] text-teal-600 font-bold px-1 flex items-center gap-1">
                                <span>✓ Sent to Clinic Desk</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* 4. Chat Input Bar */}
                <div className="p-4 bg-white border-t border-slate-200">
                  <form onSubmit={handleSendOwnerChatMessage} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Type a message or follow-up question for clinic staff... (Press Enter to send)`}
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      className="flex-1 p-3.5 rounded-2xl border border-slate-300 focus:border-teal-500 focus:outline-none text-xs leading-relaxed bg-slate-50/60"
                    />

                    <button
                      type="submit"
                      disabled={isSendingChat || !chatInputText.trim()}
                      className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-40 cursor-pointer shrink-0"
                    >
                      <Send className={`w-4 h-4 ${isSendingChat ? 'animate-spin' : ''}`} />
                      <span>{isSendingChat ? 'Sending...' : 'Send'}</span>
                    </button>
                  </form>
                  <p className="text-[10px] text-slate-400 mt-2 px-1">
                    🟢 Messages and replies update instantly via real-time WebSocket sync.
                  </p>
                </div>
              </div>
            ) : (
              /* New Consultation Topic Form */
              <div className="clinic-card p-6 border border-teal-200 bg-white shadow-sm space-y-4 rounded-3xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-teal-600" />
                      Start Consultation Topic with Heritage Animal Clinic
                    </h3>
                    <p className="text-xs text-slate-500">
                      Select your registered pet and inquiry topic to begin a live consultation thread.
                    </p>
                  </div>
                  {myInquiries.length > 0 && (
                    <button
                      onClick={() => setIsStartingNewTopic(false)}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                    >
                      ← Back to Chat
                    </button>
                  )}
                </div>

                <form onSubmit={handleSendMessageToClinic} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Select Patient Pet *</label>
                      <select
                        value={messagePetId}
                        onChange={(e) => setMessagePetId(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-bold focus:border-teal-500 focus:outline-none"
                      >
                        <option value="">General Inquiry (All / Any Pet)</option>
                        {myPets.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.species} • {p.breed || 'Mixed'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Inquiry Topic / Category *</label>
                      <select
                        value={messageSubject}
                        onChange={(e) => setMessageSubject(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-bold focus:border-teal-500 focus:outline-none"
                      >
                        <option value="General Veterinary Consultation">General Veterinary Consultation</option>
                        <option value="Feeding & Dietary Concern">Feeding & Dietary Concern</option>
                        <option value="Water Intake & Hydration Question">Water Intake & Hydration Question</option>
                        <option value="Vital Signs & Health Behavior">Vital Signs & Health Behavior</option>
                        <option value="Medication Schedule & Prescriptions">Medication Schedule & Prescriptions</option>
                        <option value="Clinic Checkup / Appointment Request">Clinic Checkup / Appointment Request</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Your Initial Message / Question for Veterinary Staff *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-300 font-medium focus:border-teal-500 focus:outline-none leading-relaxed"
                      placeholder="Describe any symptoms, dietary changes, questions about telemetry data, or instructions for the clinic staff..."
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Sending as: <strong>{currentOwner.name}</strong> ({ownerEmail})
                    </div>

                    <button
                      type="submit"
                      disabled={isSendingMessage}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {isSendingMessage ? 'Transmitting...' : 'Start Chat Thread'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ═══════════ MODAL: REGISTER NEW PET (WITH PHOTO UPLOAD) ═══════════ */}
      <Modal
        isOpen={addPetModalOpen}
        onClose={() => setAddPetModalOpen(false)}
        title="Register Pet Profile"
        subtitle="Add animal profile and picture to Heritage Animal Clinic portal"
        maxWidth="md"
      >
        <form onSubmit={handleAddPetSubmit} className="space-y-4 text-xs">
          {/* Pet Photo Upload Section */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group shrink-0">
              <img
                src={
                  petForm.avatarUrl ||
                  (petForm.species === 'Cat'
                    ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=300'
                    : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300')
                }
                alt="Pet Preview"
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-teal-500/30 border border-slate-200 shadow-sm"
              />
              <button
                type="button"
                onClick={() => addFileInputRef.current?.click()}
                className="absolute inset-0 bg-slate-900/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                title="Upload Pet Photo"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 space-y-1.5 text-center sm:text-left">
              <div className="font-bold text-slate-800 text-xs flex items-center justify-center sm:justify-start gap-1.5">
                <ImageIcon className="w-4 h-4 text-teal-600" />
                <span>Pet Picture / Photo</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Upload a clear picture of your pet (JPG, PNG, WEBP max 5MB).
              </p>
              <input
                ref={addFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => addFileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-teal-800 font-extrabold text-xs border border-slate-200 inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-teal-600" />
                {petForm.avatarUrl ? 'Change Picture' : 'Upload Pet Photo'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Pet Name *</label>
              <input
                type="text"
                required
                value={petForm.name}
                onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-teal-500 focus:outline-none"
                placeholder="e.g. Max, Bella, Milo"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Species *</label>
              <select
                value={petForm.species}
                onChange={(e) => setPetForm({ ...petForm, species: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-teal-500 focus:outline-none"
              >
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Other">Other Animal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Breed *</label>
              <input
                type="text"
                required
                value={petForm.breed}
                onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-teal-500 focus:outline-none"
                placeholder="e.g. Golden Retriever"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Age (Years) *</label>
              <input
                type="number"
                min="0"
                max="30"
                step="0.5"
                required
                value={petForm.age}
                onChange={(e) => setPetForm({ ...petForm, age: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Weight (kg) *</label>
              <input
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                required
                value={petForm.weight}
                onChange={(e) => setPetForm({ ...petForm, weight: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Animal Gender</label>
              <select
                value={petForm.sex}
                onChange={(e) => setPetForm({ ...petForm, sex: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-teal-500 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Meal Portion (Grams)</label>
              <input
                type="number"
                min="10"
                max="500"
                value={petForm.portionGrams}
                onChange={(e) => setPetForm({ ...petForm, portionGrams: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Dietary & Care Notes</label>
            <textarea
              rows={2}
              value={petForm.notes}
              onChange={(e) => setPetForm({ ...petForm, notes: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:border-teal-500 focus:outline-none"
              placeholder="Allergies, favorite food, behavioral notes..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddPetModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-md cursor-pointer"
            >
              + Add Pet
            </button>
          </div>
        </form>
      </Modal>

      {/* ═══════════ MODAL: EDIT PET DETAILS & PHOTO ═══════════ */}
      <Modal
        isOpen={!!editingPet}
        onClose={() => setEditingPet(null)}
        title={editingPet ? 'Edit ' + editingPet.name + ' Details' : 'Edit Pet'}
        subtitle="Update animal picture, age, weight, breed, and health notes"
        maxWidth="md"
      >
        <form onSubmit={handleSavePetEdit} className="space-y-4 text-xs">
          {/* Pet Photo Edit Section */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group shrink-0">
              <img
                src={petForm.avatarUrl || editingPet?.avatarUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300'}
                alt="Pet Preview"
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-teal-500/30 border border-slate-200 shadow-sm"
              />
              <button
                type="button"
                onClick={() => editFileInputRef.current?.click()}
                className="absolute inset-0 bg-slate-900/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                title="Change Pet Photo"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 space-y-1.5 text-center sm:text-left">
              <div className="font-bold text-slate-800 text-xs flex items-center justify-center sm:justify-start gap-1.5">
                <ImageIcon className="w-4 h-4 text-teal-600" />
                <span>Update Pet Picture</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Upload a new photo (JPG, PNG, WEBP max 5MB).
              </p>
              <input
                ref={editFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => editFileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-teal-800 font-extrabold text-xs border border-slate-200 inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-teal-600" />
                Select New Photo
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Pet Name *</label>
              <input
                type="text"
                required
                value={petForm.name}
                onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Species *</label>
              <select
                value={petForm.species}
                onChange={(e) => setPetForm({ ...petForm, species: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-teal-500 focus:outline-none"
              >
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Other">Other Animal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Breed *</label>
              <input
                type="text"
                required
                value={petForm.breed}
                onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Age (Years) *</label>
              <input
                type="number"
                min="0"
                max="30"
                step="0.5"
                required
                value={petForm.age}
                onChange={(e) => setPetForm({ ...petForm, age: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Weight (kg) *</label>
              <input
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                required
                value={petForm.weight}
                onChange={(e) => setPetForm({ ...petForm, weight: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Animal Gender</label>
              <select
                value={petForm.sex}
                onChange={(e) => setPetForm({ ...petForm, sex: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-teal-500 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Meal Portion (Grams)</label>
              <input
                type="number"
                min="10"
                max="500"
                value={petForm.portionGrams}
                onChange={(e) => setPetForm({ ...petForm, portionGrams: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Care & Health Notes</label>
            <textarea
              rows={3}
              value={petForm.notes}
              onChange={(e) => setPetForm({ ...petForm, notes: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingPet(null)}
              className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-md cursor-pointer"
            >
              Save Changes & Photo
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog for Pet Deletion */}
      <ConfirmDialog
        isOpen={!!deletePetTarget}
        onClose={() => setDeletePetTarget(null)}
        onConfirm={() => {
          if (deletePetTarget) {
            deletePet(deletePetTarget.id);
            setDeletePetTarget(null);
          }
        }}
        title="Delete Pet Profile"
        message={deletePetTarget ? 'Are you sure you want to remove ' + deletePetTarget.name + ' from your profile?' : ''}
        confirmText="Delete Pet"
        variant="danger"
      />
    </div>
  );
};

import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useSession } from '../contexts/SessionContext';
import { useAppContext } from '../hooks/useAppContext';
import { PetOwner, Pet } from '../types';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Dog,
  Cat,
  Edit3,
  Trash2,
  Eye
} from 'lucide-react';

export const PetOwnersPage: React.FC = () => {
  const addPetFileRef = React.useRef<HTMLInputElement>(null);
  const editPetFileRef = React.useRef<HTMLInputElement>(null);
  const { owners, addOwner, updateOwner, deleteOwnerPermanent, activeSession } = useSession();
  const { pets, updatePet, addPet, showToast } = useAppContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'active' | 'inactive' | 'archived'>('all');

  // Modals
  const [selectedOwner, setSelectedOwner] = useState<PetOwner | null>(null);
  const [viewPetsModalOpen, setViewPetsModalOpen] = useState(false);
  const [editPetModalOpen, setEditPetModalOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [addOwnerModalOpen, setAddOwnerModalOpen] = useState(false);
  const [addPetModalOpen, setAddPetModalOpen] = useState(false);
  const [deleteOwnerTarget, setDeleteOwnerTarget] = useState<PetOwner | null>(null);

  // Helper to determine if an owner is currently online in realtime
  const isOwnerOnline = (owner: PetOwner | null): boolean => {
    if (!owner) return false;
    const ownerEmailClean = (owner.email || '').trim().toLowerCase();
    const loggedInOwnerEmail = (localStorage.getItem('hn_owner_email') || '').trim().toLowerCase();
    if (loggedInOwnerEmail && (ownerEmailClean === loggedInOwnerEmail || ownerEmailClean.includes(loggedInOwnerEmail) || loggedInOwnerEmail.includes(ownerEmailClean))) {
      return true;
    }
    const lastActiveTime = Number(localStorage.getItem('hn_owner_last_active_' + ownerEmailClean) || 0);
    if (lastActiveTime && Date.now() - lastActiveTime < 2 * 60 * 1000) {
      return true;
    }
    if (owner.lastLogin) {
      const diffMs = Date.now() - new Date(owner.lastLogin).getTime();
      if (diffMs < 5 * 60 * 1000) return true;
    }
    if (activeSession && activeSession.ownerId === owner.id) return true;
    return false;
  };

  // New Owner Form State
  const [ownerForm, setOwnerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  // Edit Pet Form State
  const [petForm, setPetForm] = useState({
    name: '',
    species: 'Dog' as 'Dog' | 'Cat' | 'Other',
    breed: '',
    age: 2,
    weight: 8,
    sex: 'Male' as 'Male' | 'Female',
    notes: '',
    portionGrams: 100,
    timesPerDay: 2,
    foodType: 'Standard Clinical Diet',
    hydrationTarget: 500,
  });

  // Filter Owners
  const filteredOwners = (owners ?? []).filter((owner) => {
    const matchesSearch =
      owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      owner.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      owner.phone.includes(searchQuery) ||
      owner.id.toLowerCase().includes(searchQuery.toLowerCase());

    const isOnline = isOwnerOnline(owner);
    let matchesStatus = true;
    if (statusFilter === 'online') {
      matchesStatus = isOnline;
    } else if (statusFilter === 'offline') {
      matchesStatus = !isOnline;
    } else if (statusFilter !== 'all') {
      matchesStatus = owner.accessStatus === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  const getPetsForOwner = (owner: PetOwner): Pet[] => {
    if (!owner) return [];
    const ownerNameClean = owner.name?.trim().toLowerCase();
    const ownerEmailClean = owner.email?.trim().toLowerCase();
    const ownerPhoneDigits = owner.phone ? owner.phone.replace(/\D/g, '') : '';

    return (pets ?? []).filter((p) => {
      if (!p) return false;
      const petOwnerId = p.ownerId;
      const petOwnerName = p.ownerName?.trim().toLowerCase();
      const petOwnerEmail = p.ownerEmail?.trim().toLowerCase();
      const petOwnerPhoneDigits = p.ownerPhone ? p.ownerPhone.replace(/\D/g, '') : '';

      return (
        (petOwnerId && petOwnerId === owner.id) ||
        (owner.petIds && owner.petIds.includes(p.id)) ||
        (petOwnerEmail && petOwnerEmail === ownerEmailClean) ||
        (petOwnerName && ownerNameClean && petOwnerName === ownerNameClean) ||
        (petOwnerName && ownerEmailClean && ownerEmailClean.includes(petOwnerName)) ||
        (ownerNameClean && petOwnerEmail && ownerNameClean.includes(petOwnerEmail)) ||
        (petOwnerPhoneDigits && ownerPhoneDigits && petOwnerPhoneDigits.length >= 7 && petOwnerPhoneDigits === ownerPhoneDigits)
      );
    });
  };

  const handleOpenViewPets = (owner: PetOwner) => {
    setSelectedOwner(owner);
    setViewPetsModalOpen(true);
  };

  const handleOpenEditPet = (pet: Pet) => {
    setSelectedPet(pet);
    setPetForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      age: pet.age,
      weight: pet.weight,
      sex: (pet.sex as any) || 'Male',
      notes: pet.notes || '',
      portionGrams: pet.feedingPlan?.portionGrams || 100,
      timesPerDay: pet.feedingPlan?.timesPerDay || 2,
      foodType: pet.feedingPlan?.foodType || 'Standard Clinical Diet',
      hydrationTarget: pet.hydrationTarget || 500,
    });
    setEditPetModalOpen(true);
  };

  const handleSavePetEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPet) return;

    updatePet(selectedPet.id, {
      name: petForm.name,
      species: petForm.species,
      breed: petForm.breed,
      age: Number(petForm.age),
      weight: Number(petForm.weight),
      sex: petForm.sex,
      notes: petForm.notes,
      avatarUrl: (petForm as any).avatarUrl || selectedPet.avatarUrl,
      feedingPlan: {
        portionGrams: Number(petForm.portionGrams),
        timesPerDay: Number(petForm.timesPerDay),
        foodType: petForm.foodType,
      },
      hydrationTarget: Number(petForm.hydrationTarget),
    });

    showToast('success', 'PET DETAILS UPDATED', petForm.name + "'s profile was updated successfully.");
    setEditPetModalOpen(false);
  };

  const handleCreateOwner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerForm.name.trim() || !ownerForm.email.trim()) {
      showToast('error', 'VALIDATION ERROR', 'Please provide a name and email.');
      return;
    }

    addOwner({
      name: ownerForm.name.trim(),
      email: ownerForm.email.trim().toLowerCase(),
      phone: ownerForm.phone.trim(),
      address: ownerForm.address.trim(),
      notes: ownerForm.notes.trim(),
      petIds: [],
    });

    showToast('success', 'OWNER REGISTERED', ownerForm.name + ' has been added to the registry.');
    setOwnerForm({ name: '', email: '', phone: '', address: '', notes: '' });
    setAddOwnerModalOpen(false);
  };

  const handleAddNewPetForOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwner || !petForm.name.trim()) return;

    const createdPet = await addPet({
      name: petForm.name.trim(),
      species: petForm.species,
      breed: petForm.breed.trim(),
      age: Number(petForm.age),
      weight: Number(petForm.weight),
      sex: petForm.sex,
      ownerName: selectedOwner.name,
      ownerPhone: selectedOwner.phone,
      ownerEmail: selectedOwner.email,
      ownerId: selectedOwner.id,
      clinicRef: 'REF-2026-' + Math.floor(100 + Math.random() * 800),
      assignedDeviceId: 'Cage 1',
      healthStatus: 'Healthy',
      avatarUrl: (petForm as any).avatarUrl || (petForm.species === 'Cat'
        ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=300'
        : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300'),
      feedingPlan: {
        portionGrams: Number(petForm.portionGrams),
        timesPerDay: Number(petForm.timesPerDay),
        foodType: petForm.foodType,
      },
      hydrationTarget: Number(petForm.hydrationTarget),
      latestVitals: {
        temperature: 38.5,
        heartRate: 90,
        activityLevel: 'Normal',
        lastMeasured: 'Just registered',
      },
      notes: petForm.notes || 'Registered by clinic staff.',
    });

    if (selectedOwner.id) {
      updateOwner(selectedOwner.id, {
        petIds: Array.from(new Set([...(selectedOwner.petIds || []), createdPet.id])),
      });
    }

    showToast('success', 'PET REGISTERED', petForm.name + ' added for ' + selectedOwner.name + '.');
    setAddPetModalOpen(false);
  };

  return (
    <DashboardLayout pageTitle="Pet Owners & Registered Patients" breadcrumbs={[{ label: 'Pet Owners' }]}>
      <div className="space-y-6">
        {/* Top Header Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xl border border-teal-800/40 relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Pet Owner Community Directory</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-400/20 text-rose-300 text-[10px] font-extrabold uppercase border border-rose-400/30">
                {filteredOwners.length} Registered Owners
              </span>
            </div>
            <p className="text-xs text-rose-100/80 max-w-xl">
              Manage pet owner accounts, view linked pets, check telemetry access, and update patient medical profiles.
            </p>
          </div>

          <button
            onClick={() => setAddOwnerModalOpen(true)}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 active:scale-95 text-slate-950 font-black text-xs shadow-lg shadow-teal-400/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            + Register New Pet Owner
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="clinic-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by owner name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {(['all', 'online', 'offline', 'active', 'inactive', 'archived'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === f
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f === 'all' ? 'All Owners' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Pet Owners Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOwners.map((owner) => {
            const ownerPets = getPetsForOwner(owner);
            const online = isOwnerOnline(owner);
            return (
              <div
                key={owner.id}
                className="clinic-card p-5 space-y-4 hover:shadow-md transition-all border border-slate-200/80 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
                          {owner.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        {online ? (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
                          </span>
                        ) : (
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-slate-300 border-2 border-white" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 leading-tight">{owner.name}</h4>
                        <span className="text-[11px] font-mono text-slate-400 font-bold">{owner.id}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={online ? 'Online' : 'Offline'} size="sm" />
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="truncate">{owner.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{owner.phone}</span>
                    </div>
                    {owner.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span className="truncate">{owner.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Registered Pets Summary */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                      <span className="flex items-center gap-1.5">
                        <Dog className="w-4 h-4 text-amber-500" />
                        Registered Pets ({ownerPets.length})
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {ownerPets.map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 font-bold text-[11px] border border-rose-200"
                        >
                          {p.species === 'Cat' ? '🐱' : '🐶'} {p.name} ({p.breed || p.species})
                        </span>
                      ))}
                      {ownerPets.length === 0 && (
                        <span className="text-slate-400 text-[11px] italic">No pets registered yet</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenViewPets(owner)}
                    className="flex-1 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-rose-200"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View & Edit Pets ({ownerPets.length})
                  </button>

                  <button
                    onClick={() => {
                      setSelectedOwner(owner);
                      setPetForm({
                        name: '',
                        species: 'Dog',
                        breed: '',
                        age: 2,
                        weight: 8,
                        sex: 'Male',
                        notes: '',
                        portionGrams: 100,
                        timesPerDay: 2,
                        foodType: 'High-Protein Recipe',
                        hydrationTarget: 500,
                      });
                      setAddPetModalOpen(true);
                    }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                    title="Add Pet for this Owner"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeleteOwnerTarget(owner)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition-colors"
                    title="Delete Owner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredOwners.length === 0 && (
            <div className="col-span-full clinic-card p-12 text-center text-slate-500 space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold">No pet owners found matching your filter criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: VIEW & EDIT PETS */}
      <Modal
        isOpen={viewPetsModalOpen}
        onClose={() => setViewPetsModalOpen(false)}
        title={selectedOwner ? 'Pets of ' + selectedOwner.name : 'Owner Pets'}
        subtitle="View details, health status, and edit pet profiles"
        maxWidth="lg"
      >
        {selectedOwner && (
          <div className="space-y-5 text-xs">
            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900">{selectedOwner.name}</span>
                  <StatusBadge status={isOwnerOnline(selectedOwner) ? 'Online' : 'Offline'} size="sm" />
                </div>
                <div className="text-slate-500">{selectedOwner.email} • {selectedOwner.phone}</div>
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
                    portionGrams: 100,
                    timesPerDay: 2,
                    foodType: 'High-Protein Recipe',
                    hydrationTarget: 500,
                  });
                  setAddPetModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs flex items-center gap-1 hover:bg-rose-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Add New Pet
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {getPetsForOwner(selectedOwner).map((pet) => (
                <div
                  key={pet.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-rose-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={pet.avatarUrl}
                      alt={pet.name}
                      className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{pet.name}</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {pet.species} • {pet.breed || 'Mixed'}
                        </span>
                        <StatusBadge status={pet.healthStatus} size="sm" />
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-3">
                        <span><strong>Age:</strong> {pet.age} yrs</span>
                        <span><strong>Weight:</strong> {pet.weight} kg</span>
                        <span><strong>Sex:</strong> {pet.sex || 'Male'}</span>
                      </div>
                      {pet.notes && (
                        <p className="text-[11px] text-slate-600 line-clamp-1 italic">
                          Notes: {pet.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEditPet(pet)}
                    className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs flex items-center gap-1.5 transition-all border border-rose-200 self-stretch sm:self-auto justify-center"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Pet Details
                  </button>
                </div>
              ))}

              {getPetsForOwner(selectedOwner).length === 0 && (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                  <Dog className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold">No pets linked to this owner yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: EDIT PET DETAILS */}
      <Modal
        isOpen={editPetModalOpen}
        onClose={() => setEditPetModalOpen(false)}
        title={selectedPet ? 'Edit Details for ' + selectedPet.name : 'Edit Pet'}
        subtitle="Update patient age, weight, breed, and medical dietary instructions"
      >
        <form onSubmit={handleSavePetEdit} className="space-y-4 text-xs">

          {/* Pet Photo Upload */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3.5">
            <img
              src={
                (petForm as any).avatarUrl ||
                selectedPet?.avatarUrl ||
                (petForm.species === 'Cat'
                  ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200'
                  : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200')
              }
              alt="Preview"
              className="w-14 h-14 rounded-xl object-cover ring-2 ring-rose-500/20 border border-slate-200"
            />
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-800 block">Update Pet Picture</span>
              <input
                ref={editPetFileRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setPetForm(prev => ({ ...prev, avatarUrl: reader.result as string } as any));
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => editPetFileRef.current?.click()}
                className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-rose-800 hover:bg-slate-100 cursor-pointer shadow-2xs"
              >
                {(petForm as any).avatarUrl ? 'Change Photo' : 'Upload Pet Photo'}
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
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Species *</label>
              <select
                value={petForm.species}
                onChange={(e) => setPetForm({ ...petForm, species: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-rose-500 focus:outline-none"
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
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-rose-500 focus:outline-none"
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
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-rose-500 focus:outline-none"
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
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Sex</label>
              <select
                value={petForm.sex}
                onChange={(e) => setPetForm({ ...petForm, sex: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-rose-500 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Food Portion (Grams)</label>
              <input
                type="number"
                min="10"
                max="500"
                value={petForm.portionGrams}
                onChange={(e) => setPetForm({ ...petForm, portionGrams: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Dietary & Health Notes</label>
            <textarea
              rows={3}
              value={petForm.notes}
              onChange={(e) => setPetForm({ ...petForm, notes: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:border-rose-500 focus:outline-none"
              placeholder="Allergies, chronic conditions, behavioral notes..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditPetModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-md"
            >
              Save Pet Details
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD OWNER */}
      <Modal
        isOpen={addOwnerModalOpen}
        onClose={() => setAddOwnerModalOpen(false)}
        title="Register New Pet Owner"
        subtitle="Add a new client to Heritage Animal Clinic registry"
      >
        <form onSubmit={handleCreateOwner} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={ownerForm.name}
              onChange={(e) => setOwnerForm({ ...ownerForm, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-rose-500 focus:outline-none"
              placeholder="e.g. Elena Rostova"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={ownerForm.email}
                onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-rose-500 focus:outline-none"
                placeholder="elena@example.com"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={ownerForm.phone}
                onChange={(e) => setOwnerForm({ ...ownerForm, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-rose-500 focus:outline-none"
                placeholder="+63 912 345 6789"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Home Address</label>
            <input
              type="text"
              value={ownerForm.address}
              onChange={(e) => setOwnerForm({ ...ownerForm, address: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:border-rose-500 focus:outline-none"
              placeholder="City, Province / Region"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Administrative Notes</label>
            <textarea
              rows={2}
              value={ownerForm.notes}
              onChange={(e) => setOwnerForm({ ...ownerForm, notes: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:border-rose-500 focus:outline-none"
              placeholder="Preferred contact hours, veterinarian notes..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddOwnerModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-md"
            >
              Register Owner
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD PET FOR OWNER */}
      <Modal
        isOpen={addPetModalOpen}
        onClose={() => setAddPetModalOpen(false)}
        title={selectedOwner ? 'Register New Pet for ' + selectedOwner.name : 'Register Pet'}
        subtitle="Add animal medical profile to clinical database"
      >
        <form onSubmit={handleAddNewPetForOwner} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Pet Name *</label>
              <input
                type="text"
                required
                value={petForm.name}
                onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-rose-500 focus:outline-none"
                placeholder="e.g. Milo"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Species *</label>
              <select
                value={petForm.species}
                onChange={(e) => setPetForm({ ...petForm, species: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-rose-500 focus:outline-none"
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
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-rose-500 focus:outline-none"
                placeholder="e.g. Beagle"
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
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-rose-500 focus:outline-none"
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
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Dietary & Health Notes</label>
            <textarea
              rows={2}
              value={petForm.notes}
              onChange={(e) => setPetForm({ ...petForm, notes: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:border-rose-500 focus:outline-none"
              placeholder="Vaccines, medications, behavioral notes..."
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
              className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-md"
            >
              Register Pet
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteOwnerTarget}
        onClose={() => setDeleteOwnerTarget(null)}
        onConfirm={() => {
          if (deleteOwnerTarget) {
            deleteOwnerPermanent(deleteOwnerTarget.id, 'Admin');
            showToast('info', 'OWNER REMOVED', deleteOwnerTarget.name + ' was removed from the database.');
            setDeleteOwnerTarget(null);
          }
        }}
        title="Delete Pet Owner Record"
        message={deleteOwnerTarget ? 'Are you sure you want to permanently delete ' + deleteOwnerTarget.name + '? Associated pets and historical telemetry will be preserved in logs.' : ''}
        confirmText="Delete Record"
        variant="danger"
      />
    </DashboardLayout>
  );
};

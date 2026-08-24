import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { useAppContext } from '../hooks/useAppContext';
import { useSession } from '../contexts/SessionContext';
import { Pet, HealthStatus } from '../types';
import {
  Dog,
  Cat,
  Plus,
  Search,
  Grid,
  List,
  Eye,
  Edit,
  Trash2,
  Cpu,
  UserCheck,
  History,
} from 'lucide-react';
import { formatWeight, formatTemperature } from '../utils/formatters';

export const PetsPage: React.FC = () => {
  const addPetFileRef = React.useRef<HTMLInputElement>(null);
  const editPetFileRef = React.useRef<HTMLInputElement>(null);
  const { pets, devices, addPet, updatePet, deletePet } = useAppContext();
  const { sessions, activeSession } = useSession();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  // Add/Edit Form State
  const [formData, setFormData] = useState({
    name: '',
    species: 'Dog' as 'Dog' | 'Cat' | 'Other',
    breed: '',
    age: 3,
    weight: 10,
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    clinicRef: 'REF-2026-999',
    assignedDeviceId: 'Cage 1',
    healthStatus: 'Healthy' as HealthStatus,
    avatarUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=300',
    portionGrams: 100,
    timesPerDay: 2,
    foodType: 'Standard Clinical Diet',
    hydrationTarget: 600,
    notes: 'Registered patient.'
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      species: 'Dog',
      breed: '',
      age: 2,
      weight: 8,
      ownerName: '',
      ownerPhone: '',
      ownerEmail: '',
      clinicRef: `REF-2026-${Math.floor(100 + Math.random() * 800)}`,
      assignedDeviceId: devices[0]?.id || 'Cage 1',
      healthStatus: 'Healthy',
      avatarUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300',
      portionGrams: 120,
      timesPerDay: 2,
      foodType: 'High-Protein Recipe',
      hydrationTarget: 500,
      notes: 'Initial checkup completed.'
    });
    setAddModalOpen(true);
  };

  const handleOpenEdit = (pet: Pet) => {
    setSelectedPet(pet);
    setFormData({
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      age: pet.age,
      weight: pet.weight,
      ownerName: pet.ownerName,
      ownerPhone: pet.ownerPhone,
      ownerEmail: pet.ownerEmail || '',
      clinicRef: pet.clinicRef,
      assignedDeviceId: pet.assignedDeviceId,
      healthStatus: pet.healthStatus,
      avatarUrl: pet.avatarUrl,
      portionGrams: pet.feedingPlan?.portionGrams || 120,
      timesPerDay: pet.feedingPlan?.timesPerDay || 2,
      foodType: pet.feedingPlan?.foodType || 'Standard Clinical Diet',
      hydrationTarget: pet.hydrationTarget || 500,
      notes: pet.notes || ''
    });
    setEditModalOpen(true);
  };

  const handleOpenDelete = (pet: Pet) => {
    setSelectedPet(pet);
    setDeleteModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPet({
      name: formData.name,
      species: formData.species,
      breed: formData.breed,
      age: Number(formData.age),
      weight: Number(formData.weight),
      ownerName: formData.ownerName,
      ownerPhone: formData.ownerPhone,
      ownerEmail: formData.ownerEmail || undefined,
      clinicRef: formData.clinicRef,
      assignedDeviceId: formData.assignedDeviceId,
      healthStatus: formData.healthStatus,
      avatarUrl: formData.avatarUrl,
      feedingPlan: {
        portionGrams: Number(formData.portionGrams),
        timesPerDay: Number(formData.timesPerDay),
        foodType: formData.foodType
      },
      hydrationTarget: Number(formData.hydrationTarget),
      notes: formData.notes
    });
    setAddModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPet) return;
    updatePet(selectedPet.id, {
      name: formData.name,
      species: formData.species,
      breed: formData.breed,
      age: Number(formData.age),
      weight: Number(formData.weight),
      ownerName: formData.ownerName,
      ownerPhone: formData.ownerPhone,
      ownerEmail: formData.ownerEmail || undefined,
      assignedDeviceId: formData.assignedDeviceId,
      healthStatus: formData.healthStatus,
      avatarUrl: formData.avatarUrl,
      feedingPlan: {
        portionGrams: Number(formData.portionGrams),
        timesPerDay: Number(formData.timesPerDay),
        foodType: formData.foodType
      },
      hydrationTarget: Number(formData.hydrationTarget),
      notes: formData.notes
    });
    setEditModalOpen(false);
  };

  // Filtering
  const filteredPets = (pets ?? []).filter(pet => {
    const matchesSearch =
      (pet.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pet.breed ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pet.ownerName ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pet.ownerEmail ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pet.ownerPhone ?? '').includes(searchTerm) ||
      (pet.id ?? '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpecies = speciesFilter === 'All' || pet.species === speciesFilter;
    const matchesStatus = statusFilter === 'All' || pet.healthStatus === statusFilter;

    return matchesSearch && matchesSpecies && matchesStatus;
  });

  return (
    <DashboardLayout pageTitle="Registered Pets Directory" breadcrumbs={[{ label: 'Pets' }]}>
      {/* ================= TOP ACTION & FILTER BAR ================= */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by pet name, breed, owner..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs font-medium bg-white border border-slate-300 rounded-xl focus:border-rose-500 focus:outline-none"
          />
        </div>

        {/* Filters & View Toggle */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <select
            value={speciesFilter}
            onChange={e => setSpeciesFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:border-rose-500 focus:outline-none"
          >
            <option value="All">All Species</option>
            <option value="Dog">Dogs</option>
            <option value="Cat">Cats</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:border-rose-500 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Healthy">Healthy</option>
            <option value="Attention Needed">Attention Needed</option>
            <option value="Critical">Critical</option>
          </select>

          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Pet
          </button>
        </div>
      </div>

      {/* ================= CONTENT VIEW (GRID / TABLE) ================= */}
      {filteredPets.length === 0 ? (
        <EmptyState
          title="No Pets Found"
          description="No pet records match your current search or filter criteria."
          icon={Dog}
          action={
            <button
              onClick={() => {
                setSearchTerm('');
                setSpeciesFilter('All');
                setStatusFilter('All');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800"
            >
              Reset Filters
            </button>
          }
        />
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPets.map(pet => {
            const petActiveSession = (sessions || []).find(s => s.status === 'active' && (s.petId === pet.id || s.petName?.toLowerCase() === pet.name?.toLowerCase()));
            const petPastSessions = (sessions || []).filter(s => s.status !== 'active' && (s.petId === pet.id || s.petName?.toLowerCase() === pet.name?.toLowerCase()));

            return (
              <div key={pet.id} className="clinic-card p-5 space-y-4 flex flex-col justify-between hover:border-rose-300 transition-all">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={pet.avatarUrl}
                        alt={pet.name}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-rose-500/20 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-slate-900">{pet.name}</h3>
                          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">{pet.id}</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          {pet.species} • {pet.breed}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={pet.healthStatus} size="sm" />
                  </div>

                  {/* Session Stay Indicator */}
                  <div className="pt-2">
                    {petActiveSession ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold flex items-center gap-1.5 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Active in {petActiveSession.deviceId}
                      </span>
                    ) : petPastSessions.length > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold w-fit">
                        ✓ {petPastSessions.length} Past Clinic Stay{petPastSessions.length > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium w-fit">
                        Registered Patient
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Age &amp; Weight</span>
                      <p className="font-bold text-slate-800 mt-0.5">{pet.age} yrs • {formatWeight(pet.weight)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Assigned Station</span>
                      <p className="font-bold text-rose-600 mt-0.5 flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5" />
                        {petActiveSession ? petActiveSession.deviceId : (!pet.assignedDeviceId || pet.assignedDeviceId.startsWith('HN-DEV') ? 'Cage 1' : pet.assignedDeviceId)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-500 space-y-1">
                    <p className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Owner: <strong className="text-slate-800">{pet.ownerName}</strong> ({pet.ownerPhone})</span>
                    </p>
                    {pet.ownerEmail && (
                      <p className="text-[11px] text-slate-400 pl-5 truncate">
                        {pet.ownerEmail}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600 pt-1">
                      <span className="text-emerald-700 font-bold">Meal: {pet.feedingPlan?.portionGrams || 100}g</span>
                      <span>•</span>
                      <span className="text-sky-700 font-bold">Target: {pet.hydrationTarget || 500}ml</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    onClick={() => navigate(`/app/pets/${pet.id}`)}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200"
                  >
                    <History className="w-3.5 h-3.5" />
                    Profile &amp; Stays
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(pet)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                      title="Edit Pet"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(pet)}
                      className="p-2 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors cursor-pointer"
                      title="Delete Pet"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="clinic-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-bold">Patient</th>
                  <th className="p-4 font-bold">Stay Status</th>
                  <th className="p-4 font-bold">Species &amp; Breed</th>
                  <th className="p-4 font-bold">Owner Contact</th>
                  <th className="p-4 font-bold">Health Status</th>
                  <th className="p-4 font-bold">Hardware Unit</th>
                  <th className="p-4 font-bold">Diet &amp; Hydration</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPets.map(pet => {
                  const petActiveSession = (sessions || []).find(s => s.status === 'active' && (s.petId === pet.id || s.petName?.toLowerCase() === pet.name?.toLowerCase()));
                  const petPastSessions = (sessions || []).filter(s => s.status !== 'active' && (s.petId === pet.id || s.petName?.toLowerCase() === pet.name?.toLowerCase()));

                  return (
                    <tr key={pet.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={pet.avatarUrl}
                            alt={pet.name}
                            className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                          />
                          <div>
                            <p className="font-extrabold text-slate-900">{pet.name}</p>
                            <span className="text-[10px] text-slate-400 font-mono">{pet.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {petActiveSession ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            🟢 Live Stay
                          </span>
                        ) : petPastSessions.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 text-[10px] font-bold">
                            ✓ {petPastSessions.length} Past
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-700">{pet.species}</p>
                        <p className="text-[11px] text-slate-500">{pet.breed}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-800">{pet.ownerName}</p>
                        <p className="text-[11px] text-slate-500">{pet.ownerPhone}</p>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={pet.healthStatus} size="sm" />
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-md bg-rose-50 text-rose-800 text-[11px] font-bold font-mono">
                          {petActiveSession ? petActiveSession.deviceId : (!pet.assignedDeviceId || pet.assignedDeviceId.startsWith('HN-DEV') ? 'Cage 1' : pet.assignedDeviceId)}
                        </span>
                      </td>
                      <td className="p-4 text-[11px]">
                        <span className="font-bold text-emerald-700">{pet.feedingPlan?.portionGrams || 100}g portion</span>
                        <span className="text-slate-400 mx-1">•</span>
                        <span className="font-bold text-sky-700">{pet.hydrationTarget || 500}ml target</span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/app/pets/${pet.id}`)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-rose-700 font-bold cursor-pointer"
                            title="View Profile & Stay History"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(pet)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(pet)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= ADD PET MODAL ================= */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Register New Pet Patient"
        subtitle="Heritage Animal Clinic Intake Form"
        maxWidth="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Pet Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none"
                placeholder="e.g. Max"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Species *</label>
              <select
                value={formData.species}
                onChange={e => setFormData({ ...formData, species: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none font-semibold"
              >
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Breed</label>
              <input
                type="text"
                value={formData.breed}
                onChange={e => setFormData({ ...formData, breed: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none"
                placeholder="e.g. Golden Retriever"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Age (Years)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Weight (kg)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.weight}
                onChange={e => setFormData({ ...formData, weight: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Owner Name *</label>
              <input
                type="text"
                required
                value={formData.ownerName}
                onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none"
                placeholder="e.g. Eleanor Vance"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Owner Phone</label>
              <input
                type="text"
                value={formData.ownerPhone}
                onChange={e => setFormData({ ...formData, ownerPhone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none"
                placeholder="(555) 000-0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Assign Device Node</label>
              <select
                value={formData.assignedDeviceId}
                onChange={e => setFormData({ ...formData, assignedDeviceId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none font-semibold"
              >
                {devices.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.id} ({d.assignedPetName})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Health Status</label>
              <select
                value={formData.healthStatus}
                onChange={e => setFormData({ ...formData, healthStatus: e.target.value as HealthStatus })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none font-semibold"
              >
                <option value="Healthy">Healthy</option>
                <option value="Attention Needed">Attention Needed</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Veterinary Medical Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none"
              placeholder="Allergies, chronic conditions, behavioral notes..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm"
            >
              Register Patient
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= EDIT PET MODAL ================= */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Pet Patient Record"
        subtitle={`Updating profile for ${selectedPet?.name || 'Pet'}`}
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Pet Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Species *</label>
              <select
                value={formData.species}
                onChange={e => setFormData({ ...formData, species: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none font-semibold"
              >
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Breed</label>
              <input
                type="text"
                value={formData.breed}
                onChange={e => setFormData({ ...formData, breed: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Age (Years)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Weight (kg)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.weight}
                onChange={e => setFormData({ ...formData, weight: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Assigned Device Node</label>
              <select
                value={formData.assignedDeviceId}
                onChange={e => setFormData({ ...formData, assignedDeviceId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none font-semibold"
              >
                {devices.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Health Status</label>
              <select
                value={formData.healthStatus}
                onChange={e => setFormData({ ...formData, healthStatus: e.target.value as HealthStatus })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none font-semibold"
              >
                <option value="Healthy">Healthy</option>
                <option value="Attention Needed">Attention Needed</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Veterinary Medical Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= DELETE CONFIRM DIALOG ================= */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => {
          if (selectedPet) deletePet(selectedPet.id);
        }}
        title="Delete Pet Record?"
        message={`Are you sure you want to remove ${selectedPet?.name} (${selectedPet?.id}) from Heritage Animal Clinic records?`}
        confirmText="Delete Pet"
        variant="danger"
      />
    </DashboardLayout>
  );
};

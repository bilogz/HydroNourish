/**
 * HydroNourish — Assign Pet and Owner Modal
 * Multi-step modal: Select/Add Owner → Select/Add Pet → Admission Details → Confirm
 */

import React, { useState, useMemo } from 'react';
import { Modal } from '../Modal';
import { useSession } from '../../contexts/SessionContext';
import { useAppContext } from '../../hooks/useAppContext';
import { useAuth } from '../../contexts/AuthContext';
import { Pet, PetOwner } from '../../types';
import {
  User,
  Dog,
  Calendar,
  Phone,
  Mail,
  FileText,
  ChevronRight,
  ChevronLeft,
  Plus,
  Check,
  AlertTriangle,
  Cpu,
} from 'lucide-react';

interface AssignPetOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = 'owner' | 'pet' | 'details' | 'confirm';

export const AssignPetOwnerModal: React.FC<AssignPetOwnerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { owners, addOwner, updateOwner, assignPetAndOwner, canAssignPet, activeSession, queuedSessions, hardware } = useSession();
  const { pets, addPet, showToast } = useAppContext();
  const { adminProfile } = useAuth();

  const [step, setStep] = useState<Step>('owner');
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [selectedPetId, setSelectedPetId] = useState('');
  const [showNewOwnerForm, setShowNewOwnerForm] = useState(false);
  const [showNewPetForm, setShowNewPetForm] = useState(false);

  // New owner form
  const [newOwner, setNewOwner] = useState({ name: '', email: '', phone: '', notes: '' });

  // New pet form
  const [newPet, setNewPet] = useState({
    name: '', species: 'Dog' as 'Dog' | 'Cat' | 'Other', breed: '', age: 1, sex: 'Male' as 'Male' | 'Female',
    weight: 5, portionGrams: 100, timesPerDay: 2, foodType: 'Dry Kibble', hydrationTarget: 500,
  });

  // Admission details
  const [admissionDate, setAdmissionDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [expectedRelease, setExpectedRelease] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [notes, setNotes] = useState('');

  const selectedOwner = useMemo(() => owners.find(o => o.id === selectedOwnerId), [owners, selectedOwnerId]);
  const selectedPet = useMemo(() => (pets ?? []).find(p => p.id === selectedPetId), [pets, selectedPetId]);
  const ownerPets = useMemo(() =>
    selectedOwner ? (pets ?? []).filter(p => p.ownerId === selectedOwner.id) : [],
    [pets, selectedOwner]
  );

  const adminName = adminProfile?.full_name ?? 'Administrator';

  const resetForm = () => {
    setStep('owner');
    setSelectedOwnerId('');
    setSelectedPetId('');
    setShowNewOwnerForm(false);
    setShowNewPetForm(false);
    setNewOwner({ name: '', email: '', phone: '', notes: '' });
    setNewPet({ name: '', species: 'Dog', breed: '', age: 1, sex: 'Male', weight: 5, portionGrams: 100, timesPerDay: 2, foodType: 'Dry Kibble', hydrationTarget: 500 });
    setAdmissionDate(new Date().toISOString().slice(0, 16));
    setExpectedRelease('');
    setEmergencyContact('');
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreateOwner = () => {
    if (!newOwner.name.trim() || !newOwner.email.trim() || !newOwner.phone.trim()) {
      showToast('error', 'Validation Error', 'Owner name, email, and phone are required.');
      return;
    }
    const created = addOwner({ name: newOwner.name, email: newOwner.email, phone: newOwner.phone, petIds: [], notes: newOwner.notes });
    setSelectedOwnerId(created.id);
    setShowNewOwnerForm(false);
    showToast('success', 'Owner Created', `${created.name} has been registered.`);
  };

  const handleCreatePet = async () => {
    if (!newPet.name.trim() || !newPet.breed.trim()) {
      showToast('error', 'Validation Error', 'Pet name and breed are required.');
      return;
    }
    const owner = owners.find(o => o.id === selectedOwnerId);
    if (!owner) return;

    const petData: Omit<Pet, 'id'> = {
      name: newPet.name,
      species: newPet.species,
      breed: newPet.breed,
      age: newPet.age,
      weight: newPet.weight,
      sex: newPet.sex,
      ownerName: owner.name,
      ownerEmail: owner.email,
      ownerPhone: owner.phone,
      ownerId: owner.id,
      clinicRef: `REF-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
      assignedDeviceId: '',
      healthStatus: 'Healthy',
      avatarUrl: newPet.species === 'Cat'
        ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=300'
        : 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=300',
      feedingPlan: { portionGrams: newPet.portionGrams, timesPerDay: newPet.timesPerDay, foodType: newPet.foodType },
      hydrationTarget: newPet.hydrationTarget,
      latestVitals: { temperature: 38.5, heartRate: 85, activityLevel: 'Normal', lastMeasured: 'N/A' },
      emergencyContact: emergencyContact || owner.phone,
      notes: '',
    };

    const createdPet = await addPet(petData);
    if (createdPet) {
      setSelectedPetId(createdPet.id);
      if (owner.id) {
        updateOwner(owner.id, {
          petIds: Array.from(new Set([...(owner.petIds || []), createdPet.id])),
        });
      }
    }
    setShowNewPetForm(false);
  };

  const handleConfirm = () => {
    if (!selectedPet || !selectedOwnerId) return;

    const result = assignPetAndOwner(
      selectedPet,
      selectedOwnerId,
      {
        admissionDate: new Date(admissionDate).toISOString(),
        expectedReleaseDate: expectedRelease ? new Date(expectedRelease).toISOString() : new Date(Date.now() + 3 * 86400000).toISOString(),
        emergencyContact: emergencyContact || selectedPet.emergencyContact || '',
        notes,
      },
      adminName
    );

    if (result.success) {
      if (result.isQueued) {
        showToast(
          'info',
          'Added to Admission Queue',
          `${selectedPet.name} has been placed in the Admission Queue at Position #${result.queuePosition}. They will be next when Station is available.`
        );
      } else {
        showToast(
          'success',
          'Pet Assigned Successfully',
          `${selectedPet.name} has been assigned to ${hardware.deviceName || hardware.id}. Monitoring session is now active.`
        );
      }
      resetForm();
      onSuccess?.();
    } else {
      showToast('error', 'Assignment Failed', result.error || 'Unknown error occurred.');
    }
  };

  const canProceedFromOwner = !!selectedOwnerId;
  const canProceedFromPet = !!selectedPetId;
  const canProceedFromDetails = !!admissionDate;

  const stepIndicators = [
    { key: 'owner', label: 'Owner', num: 1 },
    { key: 'pet', label: 'Pet', num: 2 },
    { key: 'details', label: 'Details', num: 3 },
    { key: 'confirm', label: 'Confirm', num: 4 },
  ];

  const currentStepIndex = stepIndicators.findIndex(s => s.key === step);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Assign Pet and Owner" subtitle="HydroNourish Monitoring Session Setup" maxWidth="xl">
      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-1 mb-6">
        {stepIndicators.map((s, i) => (
          <React.Fragment key={s.key}>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              i <= currentStepIndex ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                i < currentStepIndex ? 'bg-rose-600 text-white' : i === currentStepIndex ? 'bg-rose-600 text-white' : 'bg-slate-300 text-white'
              }`}>{i < currentStepIndex ? '✓' : s.num}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < stepIndicators.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
          </React.Fragment>
        ))}
      </div>

      {/* ─── Step 1: Select Owner ─────────────────────────────────────────── */}
      {step === 'owner' && (
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-rose-600" /> Select Pet Owner
            </h4>
            <button onClick={() => setShowNewOwnerForm(!showNewOwnerForm)} className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add New Owner
            </button>
          </div>

          {showNewOwnerForm && (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                  <input type="text" value={newOwner.name} onChange={e => setNewOwner({ ...newOwner, name: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold" placeholder="Eleanor Vance" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Email *</label>
                  <input type="email" value={newOwner.email} onChange={e => setNewOwner({ ...newOwner, email: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold" placeholder="owner@email.com" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Phone *</label>
                  <input type="tel" value={newOwner.phone} onChange={e => setNewOwner({ ...newOwner, phone: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold" placeholder="(555) 000-0000" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Notes</label>
                  <input type="text" value={newOwner.notes} onChange={e => setNewOwner({ ...newOwner, notes: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold" placeholder="Optional" />
                </div>
              </div>
              <button onClick={handleCreateOwner} className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs">Create Owner</button>
            </div>
          )}

          <div className="max-h-52 overflow-y-auto space-y-2">
            {owners.filter(o => o.accessStatus !== 'archived').map(owner => (
              <button
                key={owner.id}
                onClick={() => setSelectedOwnerId(owner.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  selectedOwnerId === owner.id ? 'border-rose-400 bg-rose-50 ring-1 ring-teal-300' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-800 font-bold flex items-center justify-center text-sm">
                  {owner.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{owner.name}</p>
                  <p className="text-slate-500 truncate">{owner.email} • {owner.phone}</p>
                </div>
                {selectedOwnerId === owner.id && <Check className="w-5 h-5 text-rose-600 shrink-0" />}
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button onClick={() => setStep('pet')} disabled={!canProceedFromOwner} className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 ${canProceedFromOwner ? 'bg-rose-600 text-white hover:bg-rose-500' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 2: Select Pet ────────────────────────────────────────────── */}
      {step === 'pet' && (
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Dog className="w-4 h-4 text-amber-600" /> Select Pet for {selectedOwner?.name}
            </h4>
            <button onClick={() => setShowNewPetForm(!showNewPetForm)} className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add New Pet
            </button>
          </div>

          {showNewPetForm && (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Pet Name *</label>
                  <input type="text" value={newPet.name} onChange={e => setNewPet({ ...newPet, name: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Species *</label>
                  <select value={newPet.species} onChange={e => setNewPet({ ...newPet, species: e.target.value as 'Dog' | 'Cat' | 'Other' })} className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold">
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Breed *</label>
                  <input type="text" value={newPet.breed} onChange={e => setNewPet({ ...newPet, breed: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Age (years)</label>
                  <input type="number" min="0" step="0.5" value={newPet.age} onChange={e => setNewPet({ ...newPet, age: Number(e.target.value) })} className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Sex</label>
                  <select value={newPet.sex} onChange={e => setNewPet({ ...newPet, sex: e.target.value as 'Male' | 'Female' })} className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Weight (kg)</label>
                  <input type="number" min="0" step="0.1" value={newPet.weight} onChange={e => setNewPet({ ...newPet, weight: Number(e.target.value) })} className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Food Portion (g)</label>
                  <input type="number" min="10" value={newPet.portionGrams} onChange={e => setNewPet({ ...newPet, portionGrams: Number(e.target.value) })} className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Meals / Day</label>
                  <input type="number" min="1" max="6" value={newPet.timesPerDay} onChange={e => setNewPet({ ...newPet, timesPerDay: Number(e.target.value) })} className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Hydration (ml/day)</label>
                  <input type="number" min="50" value={newPet.hydrationTarget} onChange={e => setNewPet({ ...newPet, hydrationTarget: Number(e.target.value) })} className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold" />
                </div>
              </div>
              <button onClick={handleCreatePet} className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs">Register Pet</button>
            </div>
          )}

          {/* Existing pets for this owner */}
          <div className="max-h-48 overflow-y-auto space-y-2">
            {ownerPets.length > 0 ? ownerPets.map(pet => (
              <button
                key={pet.id}
                onClick={() => setSelectedPetId(pet.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  selectedPetId === pet.id ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-300' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <img src={pet.avatarUrl} alt={pet.name} className="w-10 h-10 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900">{pet.name}</p>
                  <p className="text-slate-500">{pet.species} • {pet.breed} • {pet.weight}kg</p>
                </div>
                {selectedPetId === pet.id && <Check className="w-5 h-5 text-amber-600 shrink-0" />}
              </button>
            )) : (
              <div className="text-center py-6 text-slate-500">
                <Dog className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-medium">No pets registered for this owner.</p>
                <p className="text-slate-400">Use "Add New Pet" above to register one.</p>
              </div>
            )}

            {/* Show all other pets too */}
            {(pets ?? []).filter(p => !ownerPets.some(op => op.id === p.id)).length > 0 && (
              <>
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 pt-3">All Registered Pets</div>
                {(pets ?? []).filter(p => !ownerPets.some(op => op.id === p.id)).map(pet => (
                  <button
                    key={pet.id}
                    onClick={() => setSelectedPetId(pet.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      selectedPetId === pet.id ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-300' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <img src={pet.avatarUrl} alt={pet.name} className="w-10 h-10 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900">{pet.name}</p>
                      <p className="text-slate-500">{pet.species} • {pet.breed} • {pet.weight}kg • Owner: {pet.ownerName}</p>
                    </div>
                    {selectedPetId === pet.id && <Check className="w-5 h-5 text-amber-600 shrink-0" />}
                  </button>
                ))}
              </>
            )}
          </div>

          <div className="flex justify-between pt-3 border-t border-slate-100">
            <button onClick={() => setStep('owner')} className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700 text-xs flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button onClick={() => setStep('details')} disabled={!canProceedFromPet} className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 ${canProceedFromPet ? 'bg-rose-600 text-white hover:bg-rose-500' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 3: Admission Details ─────────────────────────────────────── */}
      {step === 'details' && (
        <div className="space-y-4 text-xs">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" /> Admission Details
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Admission Date & Time *</label>
              <input type="datetime-local" value={admissionDate} onChange={e => setAdmissionDate(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Expected Release Date</label>
              <input type="datetime-local" value={expectedRelease} onChange={e => setExpectedRelease(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Emergency Contact</label>
              <input type="tel" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold" placeholder="(555) 000-0000" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Admission Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold resize-none" placeholder="Reason for admission, special instructions..." />
          </div>

          <div className="flex justify-between pt-3 border-t border-slate-100">
            <button onClick={() => setStep('pet')} className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700 text-xs flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button onClick={() => setStep('confirm')} disabled={!canProceedFromDetails} className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 ${canProceedFromDetails ? 'bg-rose-600 text-white hover:bg-rose-500' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
              Review & Confirm <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 4: Confirmation Summary ──────────────────────────────────── */}
      {step === 'confirm' && selectedPet && selectedOwner && (
        <div className="space-y-4 text-xs">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" /> Review & Confirm Assignment
          </h4>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
              <img src={selectedPet.avatarUrl} alt={selectedPet.name} className="w-14 h-14 rounded-xl object-cover" />
              <div>
                <p className="font-extrabold text-slate-900 text-sm">{selectedPet.name}</p>
                <p className="text-slate-500">{selectedPet.species} • {selectedPet.breed} • {selectedPet.weight}kg • Age {selectedPet.age}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-slate-500">Owner:</span> <span className="font-bold text-slate-800">{selectedOwner.name}</span></div>
              <div><span className="text-slate-500">Email:</span> <span className="font-bold text-slate-800">{selectedOwner.email}</span></div>
              <div><span className="text-slate-500">Phone:</span> <span className="font-bold text-slate-800">{selectedOwner.phone}</span></div>
              <div><span className="text-slate-500">Device:</span> <span className="font-bold text-rose-600">{selectedPet.assignedDeviceId || 'Cage 1'}</span></div>
              <div><span className="text-slate-500">Admission:</span> <span className="font-bold text-slate-800">{new Date(admissionDate).toLocaleString()}</span></div>
              <div><span className="text-slate-500">Expected Release:</span> <span className="font-bold text-slate-800">{expectedRelease ? new Date(expectedRelease).toLocaleString() : 'Not set'}</span></div>
              <div><span className="text-slate-500">Feeding:</span> <span className="font-bold text-slate-800">{selectedPet.feedingPlan.portionGrams}g × {selectedPet.feedingPlan.timesPerDay}/day</span></div>
              <div><span className="text-slate-500">Hydration:</span> <span className="font-bold text-slate-800">{selectedPet.hydrationTarget} ml/day</span></div>
            </div>
            {notes && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500">Notes:</span> <span className="font-medium text-slate-700">{notes}</span>
              </div>
            )}
          </div>

          {/* What happens on confirm */}
          {activeSession ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 space-y-1.5">
              <p className="font-extrabold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Station Alpha is Currently Monitoring {activeSession.petName}
              </p>
              <ul className="space-y-1 text-amber-800 ml-5 list-disc text-[11px]">
                <li><strong>{selectedPet.name}</strong> will be placed in the <strong>Admission Queue (Position #{queuedSessions.length + 1})</strong>.</li>
                <li>When {activeSession.petName}'s stay is discharged, {selectedPet.name} will be next in line to enter the smart station.</li>
                <li>{selectedOwner.name} can track their queue status and waitlist in their Pet Owner portal.</li>
              </ul>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1.5">
              <p className="font-bold text-indigo-800 flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> Upon confirmation:</p>
              <ul className="space-y-1 text-indigo-700 ml-5 list-disc">
                <li>An active monitoring session will be created immediately.</li>
                <li>{selectedOwner.name}'s access will be set to <strong>active</strong>.</li>
                <li>The HydroNourish hardware status will change to <strong>occupied</strong>.</li>
              </ul>
            </div>
          )}

          <div className="flex justify-between pt-3 border-t border-slate-100">
            <button onClick={() => setStep('details')} className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700 text-xs flex items-center gap-1 cursor-pointer">
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              onClick={handleConfirm}
              className={`px-6 py-2.5 rounded-xl text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all ${
                activeSession ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800' : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700'
              }`}
            >
              <Check className="w-4 h-4" />
              {activeSession ? `Add to Admission Queue (Position #${queuedSessions.length + 1})` : 'Confirm & Start Session'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

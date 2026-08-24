import React, { useState, useMemo } from 'react';
import { PetOwner, Pet } from '../../types';
import { StatusBadge } from '../StatusBadge';
import { ConfirmDialog } from '../ConfirmDialog';
import { Modal } from '../Modal';
import { useSession } from '../../contexts/SessionContext';
import { useAppContext } from '../../hooks/useAppContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  Search,
  Filter,
  UserCheck,
  UserX,
  Archive,
  Trash2,
  Phone,
  Mail,
  Dog,
  Eye,
  Edit3,
  Plus,
} from 'lucide-react';

export const PetOwnerDirectoryTable: React.FC = () => {
  const {
    owners,
    activeSession,
    deactivateOwner,
    reactivateOwner,
    archiveOwner,
    deleteOwnerPermanent,
  } = useSession();
  const { pets, updatePet, showToast } = useAppContext();
  const { adminProfile } = useAuth();

  const adminName = adminProfile?.full_name ?? 'Administrator';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all');
  const [deleteTarget, setDeleteTarget] = useState<PetOwner | null>(null);

  // Pet Viewing / Editing modal states
  const [viewingOwner, setViewingOwner] = useState<PetOwner | null>(null);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [petForm, setPetForm] = useState({
    name: '',
    species: 'Dog',
    breed: '',
    age: 2,
    weight: 8,
    sex: 'Male',
    notes: '',
  });

  const filteredOwners = useMemo(() => {
    let list = [...owners];
    if (statusFilter !== 'all') {
      list = list.filter((o) => o.accessStatus === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q) ||
          o.phone.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [owners, statusFilter, searchQuery]);

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

  const isOwnerOnline = (owner: PetOwner): boolean => {
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

  const handleOpenEditPet = (pet: Pet) => {
    setEditingPet(pet);
    setPetForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      age: pet.age,
      weight: pet.weight,
      sex: (pet.sex as any) || 'Male',
      notes: pet.notes || '',
    });
  };

  const handleSavePetEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPet) return;

    updatePet(editingPet.id, {
      name: petForm.name,
      species: petForm.species as any,
      breed: petForm.breed,
      age: Number(petForm.age),
      weight: Number(petForm.weight),
      sex: petForm.sex as any,
      notes: petForm.notes,
    });

    showToast('success', 'PET DETAILS UPDATED', petForm.name + "'s profile was updated successfully.");
    setEditingPet(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    const res = deleteOwnerPermanent(deleteTarget.id, adminName);
    if (res.success) {
      showToast('info', 'Account Deleted', deleteTarget.name + ' was permanently removed.');
    } else {
      showToast('error', 'Action Blocked', res.error ?? 'Could not delete owner.');
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
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
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-slate-400" />
          {(['all', 'active', 'inactive', 'archived'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === f
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider">Owner ID</th>
              <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider">Name & Contact</th>
              <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider">Access Status</th>
              <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider">Registered Pets</th>
              <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider">Current Session</th>
              <th className="text-center px-4 py-3 font-bold text-slate-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOwners.map((owner) => {
              const ownerPets = getPetsForOwner(owner);
              const isCurrentSessionOwner = activeSession && activeSession.ownerId === owner.id;
              return (
                <tr key={owner.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-800">{owner.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{owner.name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" />{owner.email}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" />{owner.phone}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={isOwnerOnline(owner) ? 'Online' : 'Offline'} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setViewingOwner(owner)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-[11px] border border-rose-200 transition-colors"
                    >
                      <Dog className="w-3.5 h-3.5 text-rose-600" />
                      {ownerPets.length} {ownerPets.length === 1 ? 'Pet' : 'Pets'} (View)
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {isCurrentSessionOwner ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-200">
                        <Dog className="w-3.5 h-3.5 text-indigo-500" />
                        Active ({activeSession.petName})
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">No active session</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setViewingOwner(owner)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-all text-[11px] flex items-center gap-1"
                        title="View & Edit Pets"
                      >
                        <Eye className="w-3 h-3 text-slate-500" /> View Pets
                      </button>
                      {owner.accessStatus === 'active' && (
                        <button
                          onClick={() => {
                            deactivateOwner(owner.id, adminName);
                            showToast('warning', 'Access Deactivated', owner.name + "'s monitoring access was deactivated.");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 font-semibold transition-all text-[11px] flex items-center gap-1"
                          title="Deactivate Access"
                        >
                          <UserX className="w-3 h-3" /> Deactivate
                        </button>
                      )}
                      {owner.accessStatus === 'inactive' && (
                        <button
                          onClick={() => {
                            reactivateOwner(owner.id, adminName);
                            showToast('success', 'Access Granted', owner.name + "'s monitoring access was updated.");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-semibold transition-all text-[11px] flex items-center gap-1"
                          title="Set Inactive/Ready"
                        >
                          <UserCheck className="w-3 h-3" /> Reset
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteTarget(owner)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 font-semibold transition-all text-[11px] flex items-center gap-1"
                        title="Delete Permanent"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredOwners.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No pet owners found matching your filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: VIEW & EDIT PETS OF OWNER */}
      <Modal
        isOpen={!!viewingOwner}
        onClose={() => setViewingOwner(null)}
        title={viewingOwner ? 'Pets Registered Under ' + viewingOwner.name : 'Owner Pets'}
        subtitle="View telemetry status, patient details, and edit medical profiles"
        maxWidth="lg"
      >
        {viewingOwner && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">{viewingOwner.name}</p>
                <p className="text-slate-500">{viewingOwner.email} • {viewingOwner.phone}</p>
              </div>
              <StatusBadge status={viewingOwner.accessStatus.charAt(0).toUpperCase() + viewingOwner.accessStatus.slice(1)} size="sm" />
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {getPetsForOwner(viewingOwner).map((pet) => (
                <div key={pet.id} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img src={pet.avatarUrl} alt={pet.name} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{pet.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-semibold">{pet.species} • {pet.breed}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Age: {pet.age} yrs | Weight: {pet.weight} kg | Sex: {pet.sex || 'Male'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenEditPet(pet)}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs flex items-center gap-1 border border-rose-200"
                  >
                    <Edit3 className="w-3 h-3" /> Edit Details
                  </button>
                </div>
              ))}

              {getPetsForOwner(viewingOwner).length === 0 && (
                <p className="text-center py-6 text-slate-400 italic">No registered pets found for this owner.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: EDIT PET DETAILS */}
      <Modal
        isOpen={!!editingPet}
        onClose={() => setEditingPet(null)}
        title={editingPet ? 'Edit ' + editingPet.name + ' Details' : 'Edit Pet'}
        subtitle="Update animal age, weight, breed, and health notes"
      >
        <form onSubmit={handleSavePetEdit} className="space-y-4 text-xs">
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
                onChange={(e) => setPetForm({ ...petForm, species: e.target.value })}
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
              <label className="block font-bold text-slate-700 uppercase mb-1">Breed</label>
              <input
                type="text"
                value={petForm.breed}
                onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Age (Years)</label>
              <input
                type="number"
                min="0"
                max="30"
                step="0.5"
                value={petForm.age}
                onChange={(e) => setPetForm({ ...petForm, age: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Weight (kg)</label>
              <input
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                value={petForm.weight}
                onChange={(e) => setPetForm({ ...petForm, weight: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Care & Health Notes</label>
            <textarea
              rows={3}
              value={petForm.notes}
              onChange={(e) => setPetForm({ ...petForm, notes: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:border-rose-500 focus:outline-none"
              placeholder="Vaccines, food preferences, medical conditions..."
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
              className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-md"
            >
              Save Pet Details
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Pet Owner Account"
        message={deleteTarget ? 'Are you sure you want to permanently delete ' + deleteTarget.name + '? All session history linked to this owner will remain in archives, but the owner account will be permanently removed.' : ''}
        confirmText="Permanent Delete"
        variant="danger"
      />
    </div>
  );
};

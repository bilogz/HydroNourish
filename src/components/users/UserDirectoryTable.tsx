import React, { useState, useMemo } from 'react';
import { StatusBadge } from '../StatusBadge';
import { ConfirmDialog } from '../ConfirmDialog';
import { Modal } from '../Modal';
import { EditUserModal } from './EditUserModal';
import { ClinicUser, UserRole, PetOwner, Pet } from '../../types';
import { useSession } from '../../contexts/SessionContext';
import { useAppContext } from '../../hooks/useAppContext';
import {
  Search,
  Filter,
  Crown,
  Power,
  UserX,
  Pencil,
  Dog,
  Cat,
  Heart,
  Eye,
  Edit3,
  Shield,
  Stethoscope,
  UserCheck,
  Phone,
  Mail,
  Wifi,
  Circle
} from 'lucide-react';

interface UserDirectoryTableProps {
  users: ClinicUser[];
  onToggleStatus: (user: ClinicUser) => void;
  onUpdateUser: (id: string, updated: Partial<ClinicUser>) => void;
  adminEmail: string;
}

export const UserDirectoryTable: React.FC<UserDirectoryTableProps> = ({
  users,
  onToggleStatus,
  onUpdateUser,
  adminEmail,
}) => {
  const { owners, activeSession, deactivateOwner, reactivateOwner } = useSession();
  const { pets, updatePet, showToast } = useAppContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('All');
  const [selectedUserForToggle, setSelectedUserForToggle] = useState<ClinicUser | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<ClinicUser | null>(null);

  // Pet Owner Detail Monitoring Modal state
  const [monitoringOwner, setMonitoringOwner] = useState<PetOwner | null>(null);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [petForm, setPetForm] = useState({
    name: '',
    species: 'Dog',
    breed: '',
    age: 2,
    weight: 8,
    notes: '',
  });

  // Get pets linked to an owner
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

  // Check if a staff member or owner is currently online in realtime
  const isUserOnline = (email: string, lastActiveText?: string | null): boolean => {
    if (!email) return false;
    const cleanEmail = email.toLowerCase().trim();
    const loggedInAdmin = (adminEmail || '').toLowerCase().trim();
    const loggedInOwner = (localStorage.getItem('hn_owner_email') || '').toLowerCase().trim();

    if (cleanEmail === loggedInAdmin || (loggedInOwner && (cleanEmail === loggedInOwner || cleanEmail.includes(loggedInOwner) || loggedInOwner.includes(cleanEmail)))) {
      return true;
    }
    const lastActiveTime = Number(localStorage.getItem('hn_owner_last_active_' + cleanEmail) || 0);
    if (lastActiveTime && Date.now() - lastActiveTime < 2 * 60 * 1000) {
      return true;
    }
    if (lastActiveText) {
      if (lastActiveText.includes('Now') || lastActiveText.includes('Active')) return true;
      const parsedDate = new Date(lastActiveText);
      if (!isNaN(parsedDate.getTime()) && Date.now() - parsedDate.getTime() < 5 * 60 * 1000) {
        return true;
      }
    }
    return false;
  };

  // Filter Staff Users
  const filteredUsers = useMemo(() => {
    if (selectedRoleFilter === 'Pet Owner') return [];
    return (users || []).filter((user) => {
      const nameMatch = (user.fullName || user.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const emailMatch = (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      const deptMatch = (user.department || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = nameMatch || emailMatch || deptMatch;

      const matchesRole =
        selectedRoleFilter === 'All' ? true : user.role === selectedRoleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, selectedRoleFilter]);

  // Filter Pet Owners
  const filteredOwners = useMemo(() => {
    if (selectedRoleFilter !== 'All' && selectedRoleFilter !== 'Pet Owner') return [];
    return (owners || []).filter((owner) => {
      const nameMatch = owner.name.toLowerCase().includes(searchTerm.toLowerCase());
      const emailMatch = owner.email.toLowerCase().includes(searchTerm.toLowerCase());
      const phoneMatch = owner.phone.includes(searchTerm);
      const idMatch = owner.id.toLowerCase().includes(searchTerm.toLowerCase());
      return nameMatch || emailMatch || phoneMatch || idMatch;
    });
  }, [owners, searchTerm, selectedRoleFilter]);

  const handleSavePetEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPet) return;

    updatePet(editingPet.id, {
      name: petForm.name,
      species: petForm.species as any,
      breed: petForm.breed,
      age: Number(petForm.age),
      weight: Number(petForm.weight),
      notes: petForm.notes,
    });

    showToast('success', 'PET DETAILS UPDATED', petForm.name + "'s medical profile was updated.");
    setEditingPet(null);
  };

  // Role Badge Styling Rules
  const getRoleBadgeStyle = (role: UserRole | string) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-purple-100 text-purple-700 font-semibold px-2.5 py-1 rounded-full text-xs border border-purple-200 inline-flex items-center gap-1';
      case 'Administrator':
        return 'bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-full text-xs border border-blue-200 inline-flex items-center gap-1';
      case 'Veterinarian':
        return 'bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-1 rounded-full text-xs border border-emerald-200 inline-flex items-center gap-1';
      case 'Pet Owner':
        return 'bg-rose-100 text-rose-800 font-semibold px-2.5 py-1 rounded-full text-xs border border-rose-200 inline-flex items-center gap-1';
      case 'Clinic Staff':
      default:
        return 'bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-full text-xs border border-slate-200 inline-flex items-center gap-1';
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            Registered Accounts & User Directory
          </h2>
          <p className="text-xs font-medium text-slate-500">
            Monitor staff members, veterinarians, and registered pet owners in real-time
          </p>
        </div>

        {/* Dynamic Search Bar */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, role, or phone..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Role Filter Tabs (INCLUDING PET OWNER CATEGORY) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0 mr-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        {['All', 'Super Admin', 'Administrator', 'Veterinarian', 'Clinic Staff', 'Pet Owner'].map((role) => (
          <button
            key={role}
            onClick={() => setSelectedRoleFilter(role)}
            className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              selectedRoleFilter === role
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {role}
            {role === 'Pet Owner' && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[10px]">
                {(owners || []).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table Component */}
      <div className="clinic-card overflow-hidden border border-slate-200/80 shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200/80 font-extrabold text-slate-500 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 sm:px-5 py-3.5">User Account</th>
                <th className="px-4 py-3.5">Category / Role</th>
                <th className="px-4 py-3.5">Department / Patients</th>
                <th className="px-4 py-3.5">Live Presence Status</th>
                <th className="px-4 py-3.5">Account Access</th>
                <th className="px-4 sm:px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {/* ─── 1. STAFF MEMBERS ─── */}
              {filteredUsers.map((user) => {
                const isPrimarySuperAdmin =
                  user.isProtected ||
                  user.role === 'Super Admin' ||
                  user.email.toLowerCase().includes('joecelgarcia') ||
                  user.email.toLowerCase().includes('marcgermineganan');

                const displayName = user.fullName || user.name;
                const online = isUserOnline(user.email, user.lastActive);

                return (
                  <tr key={user.id} className="hover:bg-slate-50/90 transition-colors">
                    {/* USER ACCOUNT */}
                    <td className="px-4 sm:px-5 py-3.5 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={user.avatarUrl}
                            alt={displayName}
                            className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-100 border border-slate-200 shrink-0"
                          />
                          {online ? (
                            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white" />
                            </span>
                          ) : (
                            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-slate-300 border-2 border-white" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-extrabold text-slate-900 flex items-center gap-1.5 truncate text-xs sm:text-sm">
                            {displayName}
                            {isPrimarySuperAdmin && (
                              <span title="Super Admin Master">
                                <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              </span>
                            )}
                          </span>
                          <span className="block text-[11px] text-slate-400 font-mono truncate">{user.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* CATEGORY / ROLE */}
                    <td className="px-4 py-3.5">
                      <span className={getRoleBadgeStyle(user.role)}>
                        {user.role === 'Super Admin' && <Crown className="w-3 h-3 text-purple-600" />}
                        {user.role === 'Administrator' && <Shield className="w-3 h-3 text-blue-600" />}
                        {user.role === 'Veterinarian' && <Stethoscope className="w-3 h-3 text-emerald-600" />}
                        {user.role === 'Clinic Staff' && <UserCheck className="w-3 h-3 text-slate-600" />}
                        {user.role}
                      </span>
                    </td>

                    {/* DEPARTMENT */}
                    <td className="px-4 py-3.5 font-medium text-slate-600">{user.department}</td>

                    {/* LIVE PRESENCE STATUS */}
                    <td className="px-4 py-3.5">
                      {online ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[11px] border border-emerald-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Online (Active Now)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-semibold text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          Offline ({user.lastActive || 'Recently'})
                        </span>
                      )}
                    </td>

                    {/* ACCOUNT ACCESS */}
                    <td className="px-4 py-3.5">
                      <StatusBadge status={user.status} size="sm" />
                    </td>

                    {/* ACTIONS */}
                    <td className="px-4 sm:px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedUserForEdit(user)}
                          className="p-2 rounded-xl border border-indigo-200 bg-indigo-50/60 text-indigo-600 hover:bg-indigo-100 font-bold transition-all shadow-2xs cursor-pointer"
                          title="Edit User Details & Password"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {isPrimarySuperAdmin ? (
                          <span className="text-[10px] text-purple-800 font-extrabold bg-purple-100/80 px-2.5 py-1 rounded-lg border border-purple-200 inline-flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-500" />
                            Protected
                          </span>
                        ) : (
                          <button
                            onClick={() => setSelectedUserForToggle(user)}
                            className={`p-2 rounded-xl border font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer ${
                              user.status === 'Active'
                                ? 'border-rose-200 bg-rose-50/50 text-rose-600 hover:bg-rose-100'
                                : 'border-emerald-200 bg-emerald-50/50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                            title={user.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* ─── 2. PET OWNERS CATEGORY (MONITORABLE IN USERS TABLE) ─── */}
              {filteredOwners.map((owner) => {
                const ownerPets = getPetsForOwner(owner);
                const isCurrentSessionOwner = activeSession && activeSession.ownerId === owner.id;
                const online = isUserOnline(owner.email, owner.lastLogin);

                return (
                  <tr key={owner.id} className="hover:bg-rose-50/30 transition-colors bg-rose-50/10">
                    {/* USER ACCOUNT */}
                    <td className="px-4 sm:px-5 py-3.5 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
                            {owner.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                          </div>
                          {online ? (
                            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white" />
                            </span>
                          ) : (
                            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-slate-300 border-2 border-white" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-extrabold text-slate-900 truncate text-xs sm:text-sm block">
                            {owner.name}
                          </span>
                          <span className="block text-[11px] text-slate-400 font-mono truncate">{owner.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* CATEGORY / ROLE */}
                    <td className="px-4 py-3.5">
                      <span className={getRoleBadgeStyle('Pet Owner')}>
                        <Heart className="w-3 h-3 text-rose-600" />
                        Pet Owner
                      </span>
                    </td>

                    {/* REGISTERED PATIENTS / LINKED PETS */}
                    <td className="px-4 py-3.5 font-medium">
                      <button
                        onClick={() => setMonitoringOwner(owner)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs border border-rose-200 transition-colors"
                      >
                        <Dog className="w-3.5 h-3.5 text-rose-600" />
                        {ownerPets.length} {ownerPets.length === 1 ? 'Patient' : 'Patients'} Linked
                      </button>
                    </td>

                    {/* LIVE PRESENCE STATUS */}
                    <td className="px-4 py-3.5">
                      {online ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[11px] border border-emerald-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Online (Live Telemetry)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-semibold text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          Offline ({owner.lastLogin ? new Date(owner.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never logged in'})
                        </span>
                      )}
                    </td>

                    {/* ACCOUNT ACCESS */}
                    <td className="px-4 py-3.5">
                      <StatusBadge status={owner.accessStatus.charAt(0).toUpperCase() + owner.accessStatus.slice(1)} size="sm" />
                    </td>

                    {/* ACTIONS: MONITOR PET DETAILS */}
                    <td className="px-4 sm:px-5 py-3.5 text-right">
                      <button
                        onClick={() => setMonitoringOwner(owner)}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Monitor Pet Details
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* EMPTY STATE */}
              {filteredUsers.length === 0 && filteredOwners.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="max-w-xs mx-auto space-y-3">
                      <UserX className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-slate-600 font-bold text-sm">No matching user accounts found</p>
                      <p className="text-slate-400 text-xs">
                        Try clearing your search query or role filter.
                      </p>
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedRoleFilter('All');
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                      >
                        Reset Search
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: PET OWNER DETAILS & PET MONITORING */}
      <Modal
        isOpen={!!monitoringOwner}
        onClose={() => setMonitoringOwner(null)}
        title={monitoringOwner ? 'Pet Owner Profile: ' + monitoringOwner.name : 'Pet Owner Profile'}
        subtitle="Live telemetry monitoring, contact details, and animal medical profiles"
        maxWidth="lg"
      >
        {monitoringOwner && (
          <div className="space-y-4 text-xs">
            {/* Owner Bio Summary */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">{monitoringOwner.name}</h3>
                  <p className="text-slate-500 font-mono text-[11px]">{monitoringOwner.id} • {monitoringOwner.email}</p>
                </div>
                <StatusBadge status={monitoringOwner.accessStatus.charAt(0).toUpperCase() + monitoringOwner.accessStatus.slice(1)} size="sm" />
              </div>
              <div className="flex items-center gap-4 text-slate-600 text-[11px] pt-1">
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-rose-600" />{monitoringOwner.phone}</span>
                {monitoringOwner.address && (
                  <span className="text-slate-500">• {monitoringOwner.address}</span>
                )}
              </div>
            </div>

            {/* Linked Pets Monitoring Cards */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <Dog className="w-4 h-4 text-rose-600" />
                Registered Patients ({getPetsForOwner(monitoringOwner).length})
              </h4>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {getPetsForOwner(monitoringOwner).map((pet) => (
                  <div
                    key={pet.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-rose-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img src={pet.avatarUrl} alt={pet.name} className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200" />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{pet.name}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-[10px]">
                            {pet.species} • {pet.breed}
                          </span>
                          <StatusBadge status={pet.healthStatus} size="sm" />
                        </div>
                        <p className="text-[11px] text-slate-500">
                          <strong>Age:</strong> {pet.age} yrs | <strong>Weight:</strong> {pet.weight} kg | <strong>Assigned Node:</strong> {pet.assignedDeviceId}
                        </p>
                        {pet.notes && (
                          <p className="text-[11px] text-slate-600 italic line-clamp-1">Notes: {pet.notes}</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setEditingPet(pet);
                        setPetForm({
                          name: pet.name,
                          species: pet.species,
                          breed: pet.breed,
                          age: pet.age,
                          weight: pet.weight,
                          notes: pet.notes || '',
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs flex items-center gap-1 border border-rose-200 shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Pet Details
                    </button>
                  </div>
                ))}

                {getPetsForOwner(monitoringOwner).length === 0 && (
                  <p className="text-center py-6 text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No registered pets found for this owner.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: EDIT PET DETAILS */}
      <Modal
        isOpen={!!editingPet}
        onClose={() => setEditingPet(null)}
        title={editingPet ? 'Edit Details for ' + editingPet.name : 'Edit Pet'}
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
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal for Deactivation / Activation */}
      {selectedUserForToggle && (
        <ConfirmDialog
          isOpen={!!selectedUserForToggle}
          onClose={() => setSelectedUserForToggle(null)}
          onConfirm={() => {
            onToggleStatus(selectedUserForToggle);
            setSelectedUserForToggle(null);
          }}
          title={
            selectedUserForToggle.status === 'Active'
              ? 'Deactivate ' + (selectedUserForToggle.fullName || selectedUserForToggle.name) + '?'
              : 'Activate ' + (selectedUserForToggle.fullName || selectedUserForToggle.name) + '?'
          }
          message={
            selectedUserForToggle.status === 'Active'
              ? 'Are you sure you want to deactivate account access for ' + selectedUserForToggle.email + '? They will no longer be able to log into the clinic portal.'
              : 'Are you sure you want to restore active access for ' + selectedUserForToggle.email + '?'
          }
          confirmText={selectedUserForToggle.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
          cancelText="Cancel"
          variant={selectedUserForToggle.status === 'Active' ? 'danger' : 'info'}
        />
      )}

      {/* Edit User Account Details & Password Modal */}
      {selectedUserForEdit && (
        <EditUserModal
          isOpen={!!selectedUserForEdit}
          onClose={() => setSelectedUserForEdit(null)}
          user={selectedUserForEdit}
          onUpdateUser={onUpdateUser}
          adminEmail={adminEmail}
        />
      )}
    </div>
  );
};

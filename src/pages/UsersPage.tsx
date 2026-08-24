import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAppContext } from '../hooks/useAppContext';
import { useAuth } from '../contexts/AuthContext';
import { ClinicUser } from '../types';
import { UserHeaderBanner } from '../components/users/UserHeaderBanner';
import { UserStatCards } from '../components/users/UserStatCards';
import { UserDirectoryTable } from '../components/users/UserDirectoryTable';
import { PetOwnerDirectoryTable } from '../components/users/PetOwnerDirectoryTable';
import { CreateUserModal } from '../components/users/CreateUserModal';
import { Lock, Crown, Users, HeartHandshake } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { users, addUser, updateUser, toggleUserStatus, showToast } = useAppContext();
  const { adminProfile } = useAuth();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'staff' | 'owners'>('staff');

  // Access Control check — only Super Admin and Admin can manage clinic users
  const isSuperAdmin = adminProfile?.role === 'super_admin' || adminProfile?.role === 'admin';
  const currentUserEmail = adminProfile?.email || 'admin@heritageanimalclinic.com';
  const currentUserObj = (users ?? []).find(u => u.email.toLowerCase() === currentUserEmail.toLowerCase());
 
  const handleAddUser = (userData: Omit<ClinicUser, 'id' | 'lastActive'>) => {
    addUser(userData);
  };

  const handleUpdateUser = (id: string, updated: Partial<ClinicUser>) => {
    updateUser(id, updated);
  };

  const handleToggleStatus = (user: ClinicUser) => {
    toggleUserStatus(user.id);
    const newState = user.status === 'Active' ? 'deactivated' : 'activated';
    showToast(
      user.status === 'Active' ? 'warning' : 'success',
      `Account ${newState.toUpperCase()}`,
      `${user.fullName || user.name}'s account has been ${newState}.`
    );
  };

  return (
    <DashboardLayout pageTitle="Heritage Animal Clinic User Management" breadcrumbs={[{ label: 'Users' }]}>
      {!isSuperAdmin ? (
        <div className="clinic-card p-12 text-center space-y-5 max-w-2xl mx-auto my-8 border-2 border-dashed border-amber-200 bg-amber-50/40">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900">Administrator Access Required</h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              User account management and permission provisioning are restricted to Administrator and Super Admin accounts.
              Clinic Staff accounts do not have access to view or modify other accounts.
            </p>
          </div>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-200 text-slate-800 text-xs font-extrabold">
              <Users className="w-4 h-4 text-slate-600" />
              Logged in as: {currentUserEmail} ({adminProfile?.role === 'super_admin' ? 'Super Admin' : adminProfile?.role === 'admin' ? 'Admin' : 'Clinic Staff'})
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Logged-in User Profile Status Banner */}
          <UserHeaderBanner
            userEmail={currentUserEmail}
            adminProfile={adminProfile}
            currentUserObj={currentUserObj}
            onCreateClick={() => setAddModalOpen(true)}
          />

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 gap-4 text-sm font-extrabold">
            <button
              onClick={() => setActiveTab('staff')}
              className={`pb-3 px-1 flex items-center gap-2 transition-all border-b-2 ${
                activeTab === 'staff'
                  ? 'border-rose-600 text-rose-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Clinic Staff & Accounts
            </button>
            <button
              onClick={() => setActiveTab('owners')}
              className={`pb-3 px-1 flex items-center gap-2 transition-all border-b-2 ${
                activeTab === 'owners'
                  ? 'border-rose-600 text-rose-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              Pet Owners
            </button>
          </div>

          {activeTab === 'staff' ? (
            <>
              {/* 3 Column Summary Metrics */}
              <UserStatCards users={users} />

              {/* User Directory Table with Edit Capability */}
              <UserDirectoryTable
                users={users}
                onToggleStatus={handleToggleStatus}
                onUpdateUser={handleUpdateUser}
                adminEmail={currentUserEmail}
              />
            </>
          ) : (
            <PetOwnerDirectoryTable />
          )}

          {/* Account Provisioning Modal with Password Field */}
          <CreateUserModal
            isOpen={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            onAddUser={handleAddUser}
            adminEmail={currentUserEmail}
          />
        </div>
      )}
    </DashboardLayout>
  );
};

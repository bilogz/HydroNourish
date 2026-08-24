import React from 'react';
import { StatCard } from '../StatCard';
import { Users, Stethoscope, ShieldCheck, Heart } from 'lucide-react';
import { ClinicUser } from '../../types';
import { useSession } from '../../contexts/SessionContext';

interface UserStatCardsProps {
  users: ClinicUser[];
}

export const UserStatCards: React.FC<UserStatCardsProps> = ({ users }) => {
  const { owners } = useSession();
  const totalStaffCount = (users || []).length;
  const petOwnersCount = (owners || []).length;
  const vetsCount = (users || []).filter((u) => u.role === 'Veterinarian').length;
  const superAdminCount = (users || []).filter((u) => u.role === 'Super Admin').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      <StatCard
        title="TOTAL STAFF ACCOUNTS"
        value={totalStaffCount}
        subtitle="Heritage Animal Clinic Personnel"
        icon={Users}
        iconBgColor="bg-blue-50"
        iconTextColor="text-blue-600"
        badgeText="Staff Access"
        badgeType="info"
      />
      <StatCard
        title="REGISTERED PET OWNERS"
        value={petOwnersCount}
        subtitle="Community Client Profiles"
        icon={Heart}
        iconBgColor="bg-rose-50"
        iconTextColor="text-rose-600"
        badgeText="Clients"
        badgeType="success"
      />
      <StatCard
        title="VETERINARIANS"
        value={vetsCount}
        subtitle="Clinical Medical Staff"
        icon={Stethoscope}
        iconBgColor="bg-emerald-50"
        iconTextColor="text-emerald-600"
        badgeText="Licensed"
        badgeType="success"
      />
      <StatCard
        title="SUPER ADMINS"
        value={superAdminCount}
        subtitle="Master System Controllers"
        icon={ShieldCheck}
        iconBgColor="bg-purple-50"
        iconTextColor="text-purple-600"
        badgeText="Master"
        badgeType="info"
      />
    </div>
  );
};

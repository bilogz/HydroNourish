import React from 'react';
import { StatCard } from '../StatCard';
import { Users, Stethoscope, ShieldCheck } from 'lucide-react';
import { ClinicUser } from '../../types';

interface UserStatCardsProps {
  users: ClinicUser[];
}

export const UserStatCards: React.FC<UserStatCardsProps> = ({ users }) => {
  const totalStaffCount = (users || []).length;
  const vetsCount = (users || []).filter((u) => u.role === 'Veterinarian').length;
  const superAdminCount = (users || []).filter((u) => u.role === 'Super Admin').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <StatCard
        title="TOTAL STAFF ACCOUNTS"
        value={totalStaffCount}
        subtitle="Heritage Animal Clinic Personnel"
        icon={Users}
        iconBgColor="bg-teal-50"
        iconTextColor="text-teal-600"
        badgeText="Active Access"
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
        title="SUPER ADMIN ACCOUNTS"
        value={superAdminCount}
        subtitle="Master System Controllers"
        icon={ShieldCheck}
        iconBgColor="bg-purple-50"
        iconTextColor="text-purple-600"
        badgeText="Master Privilege"
        badgeType="info"
      />
    </div>
  );
};

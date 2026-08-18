/**
 * HydroNourish — Admin Route Guard
 * Heritage Animal Clinic Capstone Project
 *
 * Extends ProtectedRoute with an additional admin-profile check.
 *
 * Access is granted only when ALL of the following are true:
 *   1. Session check is complete (not loading)
 *   2. A valid Supabase session exists
 *   3. An admin_profiles record exists for this user
 *   4. role is 'admin' or 'super_admin'
 *   5. status is 'active'
 *
 * Remember: this guard is for UI control only.
 * Real data security comes from Supabase Row Level Security policies.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthLoadingScreen } from '../components/auth/AuthLoadingScreen';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'staff';
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children, requiredRole = 'staff' }) => {
  const { isLoading, isAuthenticated, isAdmin, isStaff } = useAuth();
  const location = useLocation();

  // Show loader while session and profile are being resolved
  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  // Check if user is logged in as a pet owner
  const isOwnerLoggedIn = !!localStorage.getItem('hn_owner_email');
  if (isOwnerLoggedIn && !isAdmin && !isStaff) {
    return <Navigate to="/owner" replace />;
  }

  // No session → go to login (preserve intended destination)
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Must be active admin or staff
  if (!isAdmin && !isStaff) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If this specific route requires admin privileges (e.g. /app/users or /app/settings),
  // block staff accounts and redirect to /app
  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};

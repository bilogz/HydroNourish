/**
 * HydroNourish — Protected Route Guard
 * Heritage Animal Clinic Capstone Project
 *
 * Blocks access to any route that requires an authenticated Supabase session.
 * Shows a loading screen while the session is initializing.
 * Redirects to /admin/login if there is no valid session.
 * Preserves the intended destination so the user can return after login.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthLoadingScreen } from '../components/auth/AuthLoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // While the Supabase session is being checked, show a full-page loader
  // This prevents a flash redirect to /admin/login for users with valid sessions
  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    // Preserve the attempted URL so we can redirect back after login
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

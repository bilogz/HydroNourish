/**
 * HydroNourish — Legacy Login Page (Deprecated)
 * Heritage Animal Clinic Capstone Project
 *
 * This file is kept as a compatibility stub.
 * The real admin login is at src/pages/auth/AdminLoginPage.tsx
 * Route: /admin/login
 *
 * This page is no longer routed to in App.tsx.
 * /login now redirects to /admin/login.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  // Redirect legacy /login path to new admin login
  return <Navigate to="/admin/login" replace />;
};

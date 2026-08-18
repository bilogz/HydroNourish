/**
 * HydroNourish — Application Entry & Router
 * Heritage Animal Clinic Capstone Project
 *
 * Provider hierarchy (outermost → innermost):
 *   ErrorBoundary → AppProvider → AuthProvider → SessionProvider → BrowserRouter → Routes
 *
 * Route hierarchy:
 *   / (public — landing page)
 *   /admin/login (public — OTP login)
 *   /admin/dashboard (redirect → /app for convenience)
 *   /app/* (protected — AdminRoute guard)
 *   /owner (public — owner monitoring portal)
 *   /unauthorized (semi-public — for authenticated non-admins)
 *   * (404)
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './hooks/useAppContext';
import { AuthProvider } from './contexts/AuthContext';
import { SessionProvider } from './contexts/SessionContext';
import { AdminRoute } from './routes/AdminRoute';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { AdminLoginPage } from './pages/auth/AdminLoginPage';

// Admin Dashboard Pages (all protected)
import { OverviewPage } from './pages/OverviewPage';
import { PetsPage } from './pages/PetsPage';
import { PetOwnersPage } from './pages/PetOwnersPage';
import { PetProfilePage } from './pages/PetProfilePage';
import { FeedingPage } from './pages/FeedingPage';
import { HydrationPage } from './pages/HydrationPage';
import { AIAlertsPage } from './pages/AIAlertsPage';
import { DevicesPage } from './pages/DevicesPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { SessionHistoryPage } from './pages/SessionHistoryPage';
import { InquiriesPage } from './pages/InquiriesPage';

// Owner Pages
import { OwnerLoginPage } from './pages/auth/OwnerLoginPage';
import { OwnerRegisterPage } from './pages/auth/OwnerRegisterPage';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage';

// Utility Pages
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AuthProvider>
        <SessionProvider>
          <BrowserRouter>
            <Routes>
              {/* ─── Public Routes ─────────────────────────────────── */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* Convenience alias: /admin/dashboard → /app */}
              <Route path="/admin/dashboard" element={<Navigate to="/app" replace />} />

              {/* Legacy /login alias for backwards compat */}
              <Route path="/login" element={<Navigate to="/admin/login" replace />} />

              {/* ─── Owner Monitoring Portal Routes ───────────────── */}
              <Route path="/owner/login" element={<OwnerLoginPage />} />
              <Route path="/owner/register" element={<OwnerRegisterPage />} />
              <Route path="/owner" element={<OwnerDashboardPage />} />

              {/* ─── Protected Admin Dashboard Routes ──────────────── */}
              <Route
                path="/app"
                element={
                  <AdminRoute>
                    <OverviewPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/app/pets"
                element={
                  <AdminRoute>
                    <PetsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/app/pets/:id"
                element={
                  <AdminRoute>
                    <PetProfilePage />
                  </AdminRoute>
                }
              />
              <Route
                path="/app/pet-owners"
                element={
                  <AdminRoute>
                    <PetOwnersPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/app/feeding"
                element={
                  <AdminRoute>
                    <FeedingPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/app/hydration"
                element={
                  <AdminRoute>
                    <HydrationPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/app/vitals"
                element={<Navigate to="/app/pets" replace />}
              />
              <Route
                path="/app/alerts"
                element={
                  <AdminRoute>
                    <AIAlertsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/app/devices"
                element={
                  <AdminRoute>
                    <DevicesPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/app/reports"
                element={
                  <AdminRoute>
                    <ReportsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/app/users"
                element={
                  <AdminRoute requiredRole="admin">
                    <UsersPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/app/settings"
                element={
                  <AdminRoute requiredRole="staff">
                    <SettingsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/app/sessions"
                element={
                  <AdminRoute>
                    <SessionHistoryPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/app/inquiries"
                element={
                  <AdminRoute>
                    <InquiriesPage />
                  </AdminRoute>
                }
              />

              {/* ─── Utility Routes ─────────────────────────────────── */}
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* ─── 404 Catch-all ──────────────────────────────────── */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </SessionProvider>
      </AuthProvider>
    </AppProvider>
  );
};

export default App;

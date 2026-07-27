import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './hooks/useAppContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { PetsPage } from './pages/PetsPage';
import { PetProfilePage } from './pages/PetProfilePage';
import { FeedingPage } from './pages/FeedingPage';
import { HydrationPage } from './pages/HydrationPage';
import { VitalSignsPage } from './pages/VitalSignsPage';
import { AIAlertsPage } from './pages/AIAlertsPage';
import { DevicesPage } from './pages/DevicesPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated Dashboard Routes */}
          <Route path="/app" element={<OverviewPage />} />
          <Route path="/app/pets" element={<PetsPage />} />
          <Route path="/app/pets/:id" element={<PetProfilePage />} />
          <Route path="/app/feeding" element={<FeedingPage />} />
          <Route path="/app/hydration" element={<HydrationPage />} />
          <Route path="/app/vitals" element={<VitalSignsPage />} />
          <Route path="/app/alerts" element={<AIAlertsPage />} />
          <Route path="/app/devices" element={<DevicesPage />} />
          <Route path="/app/reports" element={<ReportsPage />} />
          <Route path="/app/users" element={<UsersPage />} />
          <Route path="/app/settings" element={<SettingsPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;

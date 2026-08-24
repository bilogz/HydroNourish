/**
 * HydroNourish — Dashboard Layout
 * Heritage Animal Clinic Capstone Project
 *
 * Preserves the existing collapsible sidebar design.
 * Admin name, email, role, and avatar are sourced from AuthContext.adminProfile
 * — never hardcoded.
 *
 * Logout opens a confirmation dialog, calls Supabase signOut,
 * then redirects to /admin/login.
 */

import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { ToastContainer } from '../components/ToastContainer';
import { useAppContext } from '../hooks/useAppContext';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import {
  Home,
  Dog,
  Utensils,
  Droplets,
  Activity,
  Bot,
  Cpu,
  FileText,
  Users,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bell,
  Search,
  LogOut,
  ShieldCheck,
  Sparkles,
  Zap,
  ClipboardList,
  HeartHandshake,
  Inbox,
  Mail,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';
import { AIAssistantModal } from '../components/AIAssistantModal';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface DashboardLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  pageTitle = 'Dashboard Overview',
  breadcrumbs = [],
}) => {
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    alerts,
    inquiries,
    unreadInquiriesCount,
  } = useAppContext();

  const { adminProfile, signOut, isAdmin, isStaff } = useAuth();
  const { activeSession, sessions } = useSession();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [automatedOpen, setAutomatedOpen] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const activeSessionCount = (sessions || []).filter((s) => s.status === 'active').length;

  const unreviewedAlerts = (alerts || []).filter(
    (a) => a && a.reviewStatus === 'Unreviewed'
  );
  const unreadInquiries = (inquiries || []).filter(
    (i) => i && i.status === 'unread'
  );
  const totalNotificationCount = unreviewedAlerts.length + unreadInquiries.length;

  // ─── Derived admin display values from AuthContext ────────────────────
  const adminName = adminProfile?.full_name ?? (isAdmin ? 'Administrator' : 'Clinic Staff Member');
  const adminEmail = adminProfile?.email ?? '';
  const adminRole =
    adminProfile?.role === 'super_admin'
      ? 'Super Admin'
      : adminProfile?.role === 'admin'
      ? 'Admin'
      : adminProfile?.role === 'veterinarian'
      ? 'Veterinarian'
      : adminProfile?.role === 'staff' || adminProfile?.role === 'clinic_staff'
      ? 'Clinic Staff'
      : isAdmin
      ? 'Administrator'
      : 'Clinic Staff';
  const adminAvatar = adminProfile?.avatar_url ?? null;

  // Generate initials for avatar fallback
  const initials = adminName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // ─── Logout ───────────────────────────────────────────────────────────
  const handleLogoutConfirm = async () => {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
    setLogoutDialogOpen(false);
    navigate('/admin/login', { replace: true });
  };

  interface NavItem {
    label: string;
    path: string;
    icon: React.ElementType;
    color?: string;
    badge?: number;
    badgeText?: string;
  }

  // ─── Navigation Items (Filtered by Admin vs Staff Permissions) ────────
  const adminGroup: NavItem[] = isAdmin
    ? [
        { label: 'Dashboard', path: '/app', icon: Home, color: 'text-blue-600' },
        { label: 'Inquiries', path: '/app/inquiries', icon: Inbox, color: 'text-rose-600', badge: unreadInquiriesCount },
        { label: 'Users', path: '/app/users', icon: Users, color: 'text-emerald-600' },
        { label: 'Reports', path: '/app/reports', icon: FileText, color: 'text-purple-600' },
        { label: 'Settings', path: '/app/settings', icon: Settings, color: 'text-slate-600' },
      ]
    : [
        { label: 'Dashboard', path: '/app', icon: Home, color: 'text-blue-600' },
        { label: 'Inquiries', path: '/app/inquiries', icon: Inbox, color: 'text-rose-600', badge: unreadInquiriesCount },
        { label: 'Reports', path: '/app/reports', icon: FileText, color: 'text-purple-600' },
      ];

  const healthGroup: NavItem[] = [
    { label: 'Pets', path: '/app/pets', icon: Dog, color: 'text-amber-600' },
    { label: 'Pet Owners', path: '/app/pet-owners', icon: HeartHandshake, color: 'text-rose-600' },
    { label: 'Sessions', path: '/app/sessions', icon: ClipboardList, color: 'text-violet-600', badgeText: activeSessionCount > 0 ? `${activeSessionCount} Active` : undefined },
    { label: 'Feeding', path: '/app/feeding', icon: Utensils, color: 'text-orange-600' },
    { label: 'Hydration', path: '/app/hydration', icon: Droplets, color: 'text-sky-600' },
  ];

  const automatedSubItems: NavItem[] = [
    { label: 'Smart Devices', path: '/app/devices', icon: Cpu, color: 'text-rose-600' },
  ];

  const renderNavLink = (
    item: { label: string; path: string; icon: React.ElementType; color?: string; badge?: number; badgeText?: string },
    isSubItem = false
  ) => {
    const Icon = item.icon;
    const isDashboard = item.path === '/app';
    const active = isDashboard
      ? location.pathname === '/app' || location.pathname === '/app/' || location.pathname === '/admin/dashboard'
      : location.pathname === item.path || location.pathname.startsWith(item.path + '/');

    return (
      <NavLink
        key={item.path + item.label}
        to={item.path}
        end={isDashboard}
        className={() => {
          return `flex items-center gap-3 ${isSubItem ? 'px-3.5 py-2 text-xs' : 'px-3 py-2.5 text-xs'} font-semibold rounded-xl transition-all group relative ${
            active
              ? 'bg-rose-50/90 text-rose-900 border border-rose-200/80 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`;
        }}
        title={sidebarCollapsed ? item.label : undefined}
      >
        <Icon
          className={`w-4 h-4 shrink-0 ${item.color || 'text-slate-500'} ${sidebarCollapsed ? 'mx-auto' : ''}`}
        />
        {!sidebarCollapsed && <span className="flex-1 truncate">{item.label}</span>}
        {!sidebarCollapsed && item.badge ? (
          <span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-500 text-white rounded-full">
            {item.badge}
          </span>
        ) : !sidebarCollapsed && item.badgeText ? (
          <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            {item.badgeText}
          </span>
        ) : null}
        {sidebarCollapsed && (item.badge || item.badgeText) ? (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        ) : null}
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans">
      {/* ═══════════ DESKTOP SIDEBAR ═══════════ */}
      <aside
        className={`hidden md:flex flex-col fixed top-0 bottom-0 left-0 z-30 bg-white text-slate-700 border-r border-slate-200/80 shadow-xs transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-slate-100">
          <Logo iconOnly={sidebarCollapsed} size="md" />
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Nav Body */}
        <div className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
          {/* ADMIN / WORKSPACE Section */}
          <div>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 px-3 mb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <span>{isAdmin ? 'ADMINISTRATION' : 'CLINICAL WORKSPACE'}</span>
                <span className="flex-1 h-px bg-slate-200/80" />
              </div>
            )}
            <div className="space-y-1">{adminGroup.map((item) => renderNavLink(item))}</div>
          </div>

          {/* VET CARE Section */}
          <div>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 px-3 mb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <span>VET CARE &amp; PATIENTS</span>
                <span className="flex-1 h-px bg-slate-200/80" />
              </div>
            )}
            <div className="space-y-1">{healthGroup.map((item) => renderNavLink(item))}</div>
          </div>

          {/* AUTOMATED MONITORING Section */}
          <div>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 px-3 mb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <span>AUTOMATED MONITORING</span>
                <span className="flex-1 h-px bg-slate-200/80" />
              </div>
            )}
            <div className="space-y-1">
              <button
                onClick={() => setAutomatedOpen(!automatedOpen)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-slate-700 hover:bg-slate-100 ${
                  automatedOpen ? 'bg-slate-100/70 border border-slate-200/60' : ''
                }`}
              >
                <Zap className="w-4 h-4 text-rose-600 shrink-0" />
                {!sidebarCollapsed && (
                  <span className="flex-1 text-left">Automated Warnings</span>
                )}
                {!sidebarCollapsed && (
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${automatedOpen ? 'rotate-180' : ''}`}
                  />
                )}
              </button>

              {automatedOpen && !sidebarCollapsed && (
                <div className="ml-4 pl-3 border-l-2 border-slate-200 space-y-1 pt-1 animate-fade-in">
                  {automatedSubItems.map((sub) => renderNavLink(sub, true))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clinic Footer + Logout */}
        <div className="border-t border-slate-100 p-3 space-y-2">
          {!sidebarCollapsed && (
            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100/60">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
                <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Heritage Animal Clinic</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                SaaS Portal · Smart ESP32 Nodes
              </p>
            </div>
          )}
          <button
            id="sidebar-logout-btn"
            onClick={() => setLogoutDialogOpen(true)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-all ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ═══════════ MOBILE DRAWER ═══════════ */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative flex-1 max-w-xs w-full bg-white text-slate-700 flex flex-col z-10 shadow-2xl">
            <div className="h-20 flex items-center justify-between px-4 border-b border-slate-100">
              <Logo size="md" />
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
              {/* Admin / Clinical Group */}
              <div>
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 mb-2">
                  {isAdmin ? 'ADMINISTRATION' : 'CLINICAL WORKSPACE'}
                </div>
                <div className="space-y-1">
                  {adminGroup.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                          isActive
                            ? 'bg-rose-50 text-rose-900 border border-rose-200 font-bold'
                            : 'text-slate-600'
                        }`
                      }
                    >
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge ? (
                        <span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-500 text-white rounded-full">
                          {item.badge}
                        </span>
                      ) : item.badgeText ? (
                        <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          {item.badgeText}
                        </span>
                      ) : null}
                    </NavLink>
                  ))}
                </div>
              </div>

              {/* Health Group */}
              <div>
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 mb-2">
                  VET CARE &amp; PATIENTS
                </div>
                <div className="space-y-1">
                  {healthGroup.map((item) => (
                    <NavLink
                      key={item.path + item.label}
                      to={item.path}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                          isActive
                            ? 'bg-rose-50 text-rose-900 border border-rose-200 font-bold'
                            : 'text-slate-600'
                        }`
                      }
                    >
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge ? (
                        <span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-500 text-white rounded-full">
                          {item.badge}
                        </span>
                      ) : item.badgeText ? (
                        <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          {item.badgeText}
                        </span>
                      ) : null}
                    </NavLink>
                  ))}
                </div>
              </div>

              {/* Automated Group */}
              <div>
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 mb-2">
                  AUTOMATED MONITORING
                </div>
                <div className="space-y-1">
                  {automatedSubItems.map((item) => (
                    <NavLink
                      key={item.path + item.label}
                      to={item.path}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                          isActive
                            ? 'bg-rose-50 text-rose-900 border border-rose-200 font-bold'
                            : 'text-slate-600'
                        }`
                      }
                    >
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge ? (
                        <span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-500 text-white rounded-full">
                          {item.badge}
                        </span>
                      ) : null}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Sidebar Footer */}
            <div className="p-4 border-t border-slate-100 space-y-2">
              {/* Admin Info */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                {adminAvatar ? (
                  <img
                    src={adminAvatar}
                    alt={adminName}
                    className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 font-extrabold text-xs flex items-center justify-center">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{adminName}</p>
                  <p className="text-[10px] text-rose-700 font-extrabold">{adminRole}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setMobileSidebarOpen(false);
                  setLogoutDialogOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 font-semibold text-xs hover:bg-rose-50 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* TOP HEADER */}
        <header className="sticky top-0 z-20 h-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Link to="/app" className="hover:text-rose-600">
                  Dashboard
                </Link>
                {breadcrumbs.map((b, idx) => (
                  <React.Fragment key={idx}>
                    <span>/</span>
                    {b.href ? (
                      <Link to={b.href} className="hover:text-rose-600">
                        {b.label}
                      </Link>
                    ) : (
                      <span className="text-slate-800 font-semibold">{b.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {pageTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden lg:block w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search pets, devices…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-slate-100 border border-transparent rounded-xl focus:bg-white focus:border-rose-500 focus:outline-none transition-all"
              />
            </div>

            {/* AI Assistant */}
            <button
              onClick={() => setAiModalOpen(true)}
              className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
              title="Launch AI Clinical Assistant"
            >
              <Sparkles className="w-4 h-4 text-rose-600" />
              <span className="hidden sm:inline">AI Pet Summary</span>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                id="notifications-bell-btn"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors relative"
                title="System Notifications & Inquiries"
              >
                <Bell className="w-5 h-5" />
                {totalNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white animate-pulse">
                    {totalNotificationCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-sm text-slate-900">Notifications &amp; Activity</h3>
                    <span className="text-xs text-slate-500 font-semibold">{totalNotificationCount} pending</span>
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-3">
                    {/* 1. CONTACT INQUIRIES NOTIFICATIONS */}
                    {unreadInquiries.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-extrabold text-rose-800 uppercase tracking-wider">
                          <span className="flex items-center gap-1.5">
                            <Inbox className="w-3.5 h-3.5 text-rose-600" />
                            Client Inquiries ({unreadInquiries.length})
                          </span>
                          <Link
                            to="/app/inquiries"
                            onClick={() => setNotificationsOpen(false)}
                            className="text-rose-600 hover:underline capitalize font-bold"
                          >
                            View All
                          </Link>
                        </div>
                        {unreadInquiries.slice(0, 3).map((inquiry) => (
                          <Link
                            key={inquiry.id}
                            to="/app/inquiries"
                            onClick={() => setNotificationsOpen(false)}
                            className="block p-3 rounded-xl bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200/80 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-rose-950 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                                {inquiry.name}
                              </span>
                              <span className="text-[10px] text-rose-700 font-mono">
                                {inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'New'}
                              </span>
                            </div>
                            <p className="text-[11px] font-semibold text-rose-900 mt-0.5 truncate">
                              {inquiry.subject}
                            </p>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                              {inquiry.message}
                            </p>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* 2. AI HEALTH OBSERVATIONS */}
                    {unreviewedAlerts.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                          <span className="flex items-center gap-1.5">
                            <Bot className="w-3.5 h-3.5 text-amber-600" />
                            AI Health Flags ({unreviewedAlerts.length})
                          </span>
                          <Link
                            to="/app/alerts"
                            onClick={() => setNotificationsOpen(false)}
                            className="text-rose-600 hover:underline capitalize font-bold"
                          >
                            View All
                          </Link>
                        </div>
                        {unreviewedAlerts.slice(0, 3).map((alert) => (
                          <Link
                            key={alert.id}
                            to="/app/alerts"
                            onClick={() => setNotificationsOpen(false)}
                            className="block p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-900">
                                {alert.petName}
                              </span>
                              <span className="text-[10px] text-slate-400">{alert.timestamp}</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                              {alert.aiObservation}
                            </p>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* EMPTY NOTIFICATIONS STATE */}
                    {totalNotificationCount === 0 && (
                      <div className="text-center py-6 space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                        <p className="text-xs font-bold text-slate-800">All Caught Up!</p>
                        <p className="text-[11px] text-slate-500">No unread inquiries or unreviewed alerts.</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                    <Link
                      to="/app/inquiries"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-rose-600 hover:underline flex items-center gap-1"
                    >
                      <Inbox className="w-3.5 h-3.5" />
                      Inquiries Hub
                    </Link>
                    <Link
                      to="/app/alerts"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-slate-600 hover:text-rose-600 hover:underline flex items-center gap-1"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      AI Observations
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
              >
                {adminAvatar ? (
                  <img
                    src={adminAvatar}
                    alt={adminName}
                    className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 font-extrabold text-xs flex items-center justify-center">
                    {initials}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{adminName}</p>
                  <p className="text-[10px] text-rose-700 font-extrabold">{adminRole}</p>
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-2 space-y-1">
                  <div className="p-2 border-b border-slate-100">
                    <p className="font-bold text-xs text-slate-900">{adminName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{adminEmail}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold">
                      {adminRole}
                    </span>
                  </div>
                  <Link
                    to="/app/settings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    Account Settings
                  </Link>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setLogoutDialogOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 font-semibold text-xs"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main
          key={location.pathname}
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 animate-fade-in"
        >
          {children}
        </main>
      </div>

      {/* AI Assistant Modal */}
      <AIAssistantModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />

      {/* Toast Container */}
      <ToastContainer />

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        onConfirm={handleLogoutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out of the administrator portal?"
        confirmText={isSigningOut ? 'Signing out…' : 'Sign Out'}
        variant="danger"
      />
    </div>
  );
};

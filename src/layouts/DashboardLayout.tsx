import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { ToastContainer } from '../components/ToastContainer';
import { useAppContext } from '../hooks/useAppContext';
import {
  LayoutDashboard,
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
  Bell,
  Search,
  LogOut,
  User,
  ShieldCheck,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { AIAssistantModal } from '../components/AIAssistantModal';

interface DashboardLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  pageTitle = 'Dashboard Overview',
  breadcrumbs = []
}) => {
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    alerts,
    logout
  } = useAppContext();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const unreviewedAlertsCount = alerts.filter(a => a.reviewStatus === 'Unreviewed').length;

  const navItems = [
    { label: 'Overview', path: '/app', icon: LayoutDashboard },
    { label: 'Pets', path: '/app/pets', icon: Dog },
    { label: 'Feeding', path: '/app/feeding', icon: Utensils },
    { label: 'Hydration', path: '/app/hydration', icon: Droplets },
    { label: 'Vital Signs', path: '/app/vitals', icon: Activity },
    { label: 'AI Health Alerts', path: '/app/alerts', icon: Bot, badge: unreviewedAlertsCount },
    { label: 'Devices', path: '/app/devices', icon: Cpu },
    { label: 'Reports', path: '/app/reports', icon: FileText },
    { label: 'Users', path: '/app/users', icon: Users },
    { label: 'Settings', path: '/app/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside
        className={`hidden md:flex flex-col fixed top-0 bottom-0 left-0 z-30 bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-slate-800">
          <Logo iconOnly={sidebarCollapsed} size="md" className="text-white" />
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/app' && location.pathname.startsWith(item.path));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive: linkActive }) => {
                  const active = linkActive || isActive;
                  return `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group relative ${
                    active
                      ? 'bg-gradient-to-r from-sky-600 to-teal-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`;
                }}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 ${sidebarCollapsed ? 'mx-auto' : ''}`} />
                {!sidebarCollapsed && <span className="flex-1">{item.label}</span>}
                {!sidebarCollapsed && item.badge ? (
                  <span className="px-2 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full">
                    {item.badge}
                  </span>
                ) : null}
                {sidebarCollapsed && item.badge ? (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
                ) : null}
              </NavLink>
            );
          })}
        </div>

        {/* Clinic Info Footer in Sidebar */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-slate-800 m-3 bg-slate-800/50 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Heritage Animal Clinic</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">SaaS Portal v1.0 • ESP32 Smart Nodes</p>
          </div>
        )}
      </aside>

      {/* ================= MOBILE DRAWER ================= */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative flex-1 max-w-xs w-full bg-slate-900 text-slate-300 flex flex-col z-10">
            <div className="h-20 flex items-center justify-between px-4 border-b border-slate-800">
              <Logo size="md" />
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-teal-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? (
                      <span className="px-2 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full">
                        {item.badge}
                      </span>
                    ) : null}
                  </NavLink>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-semibold text-sm hover:bg-slate-800"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* TOP NAVBAR HEADER */}
        <header className="sticky top-0 z-20 h-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Breadcrumb & Page Title */}
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Link to="/app" className="hover:text-teal-600">
                  Dashboard
                </Link>
                {breadcrumbs.map((b, idx) => (
                  <React.Fragment key={idx}>
                    <span>/</span>
                    {b.href ? (
                      <Link to={b.href} className="hover:text-teal-600">
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

          {/* Right Controls: Search, Notifications, Profile Dropdown */}
          <div className="flex items-center gap-3">
            {/* Global Quick Search */}
            <div className="relative hidden lg:block w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search pets, devices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-slate-100 border border-transparent rounded-xl focus:bg-white focus:border-teal-500 focus:outline-none transition-all"
              />
            </div>

            {/* AI Assistant Button */}
            <button
              onClick={() => setAiModalOpen(true)}
              className="px-3 py-2 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
              title="Launch AI Clinical Assistant"
            >
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span className="hidden sm:inline">AI Check</span>
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors relative"
                title="System Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreviewedAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white">
                    {unreviewedAlertsCount}
                  </span>
                )}
              </button>

              {/* Notifications Popover */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900">Active Health Alerts</h4>
                    <Link
                      to="/app/alerts"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs font-semibold text-teal-600 hover:underline"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-2.5">
                    {alerts.slice(0, 4).map(alert => (
                      <div
                        key={alert.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{alert.petName}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${
                            alert.severity === 'Critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-slate-600 font-medium">{alert.alertType}</p>
                        <p className="text-[11px] text-slate-400">{alert.timestamp}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <img
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200"
                  alt="Dr. Sarah Jenkins"
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
                />
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 leading-tight">Dr. Sarah Jenkins</span>
                  <span className="text-[10px] font-medium text-slate-500">Veterinarian</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-2 space-y-1 text-xs font-medium">
                  <div className="p-3 border-b border-slate-100">
                    <p className="font-bold text-slate-900">Dr. Sarah Jenkins</p>
                    <p className="text-slate-500 text-[11px]">s.jenkins@heritageanimalclinic.com</p>
                  </div>
                  <Link
                    to="/app/settings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    Account Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER WITH SMOOTH ANIMATION */}
        <main key={location.pathname} className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 animate-fade-in">
          {children}
        </main>
      </div>

      <AIAssistantModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />
      <ToastContainer />
    </div>
  );
};

import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { ToastContainer } from '../components/ToastContainer';
import { useAppContext } from '../hooks/useAppContext';
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
  User,
  ShieldCheck,
  Sparkles,
  Zap,
  Globe,
  Radio,
  Sliders,
  CheckCircle2
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

  // Accordion state for "Automated Systems" dropdown matching photo
  const [automatedOpen, setAutomatedOpen] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const unreviewedAlertsCount = alerts.filter(a => a.reviewStatus === 'Unreviewed').length;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Grouped Navigation Items (Matching photo design system)
  const adminGroup = [
    { label: 'Dashboard', path: '/app', icon: Home, color: 'text-blue-600' },
    { label: 'Users', path: '/app/users', icon: Users, color: 'text-emerald-600' },
    { label: 'Reports', path: '/app/reports', icon: FileText, color: 'text-purple-600' },
    { label: 'Settings', path: '/app/settings', icon: Settings, color: 'text-slate-600' },
  ];

  const healthGroup = [
    { label: 'Pets', path: '/app/pets', icon: Dog, color: 'text-amber-600' },
    { label: 'Feeding', path: '/app/feeding', icon: Utensils, color: 'text-orange-600' },
    { label: 'Hydration', path: '/app/hydration', icon: Droplets, color: 'text-sky-600' },
    { label: 'Vital Signs', path: '/app/vitals', icon: Activity, color: 'text-rose-600' },
  ];

  const automatedSubItems = [
    { label: 'AI Health Alerts', path: '/app/alerts', icon: Bot, color: 'text-indigo-600', badge: unreviewedAlertsCount },
    { label: 'Smart Devices', path: '/app/devices', icon: Cpu, color: 'text-teal-600' },
    { label: 'System Analytics', path: '/app/vitals', icon: Activity, color: 'text-rose-500' },
    { label: 'Clinic Settings', path: '/app/settings', icon: Settings, color: 'text-amber-500' },
  ];

  const renderNavLink = (item: { label: string; path: string; icon: any; color?: string; badge?: number }, isSubItem = false) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path || (item.path !== '/app' && location.pathname.startsWith(item.path));

    return (
      <NavLink
        key={item.path + item.label}
        to={item.path}
        className={({ isActive: linkActive }) => {
          const active = linkActive || isActive;
          return `flex items-center gap-3 ${isSubItem ? 'px-3.5 py-2 text-xs' : 'px-3 py-2.5 text-xs'} font-semibold rounded-xl transition-all group relative ${
            active
              ? 'bg-teal-50/90 text-teal-900 border border-teal-200/80 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`;
        }}
        title={sidebarCollapsed ? item.label : undefined}
      >
        <Icon className={`w-4.5 h-4.5 shrink-0 ${item.color || 'text-slate-500'} ${sidebarCollapsed ? 'mx-auto' : ''}`} />
        {!sidebarCollapsed && <span className="flex-1 truncate">{item.label}</span>}
        {!sidebarCollapsed && item.badge ? (
          <span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-500 text-white rounded-full">
            {item.badge}
          </span>
        ) : null}
        {sidebarCollapsed && item.badge ? (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        ) : null}
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans">
      {/* ================= LIGHT SIDEBAR (MATCHING PHOTO) ================= */}
      <aside
        className={`hidden md:flex flex-col fixed top-0 bottom-0 left-0 z-30 bg-white text-slate-700 border-r border-slate-200/80 shadow-xs transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Sidebar Header Logo */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-slate-100">
          <Logo iconOnly={sidebarCollapsed} size="md" />
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Sidebar Nav Body */}
        <div className="flex-1 py-4 px-3 space-y-5 overflow-y-auto custom-scrollbar">
          {/* SECTION 1: ADMIN */}
          <div>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 px-3 mb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <span>ADMIN</span>
                <span className="flex-1 h-px bg-slate-200/80" />
              </div>
            )}
            <div className="space-y-1">
              {adminGroup.map(item => renderNavLink(item))}
            </div>
          </div>

          {/* SECTION 2: HEALTHCARE & PET CARE */}
          <div>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 px-3 mb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <span>VET CARE & PATIENTS</span>
                <span className="flex-1 h-px bg-slate-200/80" />
              </div>
            )}
            <div className="space-y-1">
              {healthGroup.map(item => renderNavLink(item))}
            </div>
          </div>

          {/* SECTION 3: AUTOMATED MONITORING (COLLAPSIBLE DROPDOWN LIKE PHOTO) */}
          <div>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 px-3 mb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <span>AUTOMATED MONITORING</span>
                <span className="flex-1 h-px bg-slate-200/80" />
              </div>
            )}
            <div className="space-y-1">
              {/* Accordion Toggle Pill Button */}
              <button
                onClick={() => setAutomatedOpen(!automatedOpen)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-slate-700 hover:bg-slate-100 ${
                  automatedOpen ? 'bg-slate-100/70 border border-slate-200/60' : ''
                }`}
              >
                <Zap className="w-4.5 h-4.5 text-teal-600 shrink-0" />
                {!sidebarCollapsed && <span className="flex-1 text-left">Automated Warnings</span>}
                {!sidebarCollapsed && (
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${automatedOpen ? 'rotate-180' : ''}`} />
                )}
              </button>

              {/* Nested Dropdown Sub-Items */}
              {automatedOpen && !sidebarCollapsed && (
                <div className="ml-4 pl-3 border-l-2 border-slate-200 space-y-1 pt-1 animate-fade-in">
                  {automatedSubItems.map(subItem => renderNavLink(subItem, true))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clinic Footer */}
        {!sidebarCollapsed && (
          <div className="p-3 border-t border-slate-100 m-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-700">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Heritage Animal Clinic</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">SaaS Portal • Smart ESP32 Nodes</p>
          </div>
        )}
      </aside>

      {/* ================= MOBILE DRAWER ================= */}
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
              <div>
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 mb-2">ADMIN</div>
                <div className="space-y-1">
                  {adminGroup.map(item => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                          isActive ? 'bg-teal-50 text-teal-900 border border-teal-200 font-bold' : 'text-slate-600'
                        }`
                      }
                    >
                      <item.icon className={`w-4.5 h-4.5 ${item.color}`} />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 mb-2">VET CARE & PATIENTS</div>
                <div className="space-y-1">
                  {healthGroup.map(item => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                          isActive ? 'bg-teal-50 text-teal-900 border border-teal-200 font-bold' : 'text-slate-600'
                        }`
                      }
                    >
                      <item.icon className={`w-4.5 h-4.5 ${item.color}`} />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 mb-2">AUTOMATED MONITORING</div>
                <div className="space-y-1">
                  {automatedSubItems.map(item => (
                    <NavLink
                      key={item.path + item.label}
                      to={item.path}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                          isActive ? 'bg-teal-50 text-teal-900 border border-teal-200 font-bold' : 'text-slate-600'
                        }`
                      }
                    >
                      <item.icon className={`w-4.5 h-4.5 ${item.color}`} />
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

            <div className="p-4 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
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
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-6 h-6" />
            </button>

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

          <div className="flex items-center gap-3">
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

            <button
              onClick={() => setAiModalOpen(true)}
              className="px-3 py-2 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
              title="Launch AI Clinical Assistant"
            >
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span className="hidden sm:inline">AI Check</span>
            </button>

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

              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-sm text-slate-900">Unreviewed Observations</h3>
                    <span className="text-xs text-slate-500">{unreviewedAlertsCount} pending</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {alerts.filter(a => a.reviewStatus === 'Unreviewed').map(alert => (
                      <Link
                        key={alert.id}
                        to="/app/alerts"
                        onClick={() => setNotificationsOpen(false)}
                        className="block p-3 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{alert.petName}</span>
                          <span className="text-[10px] text-slate-400">{alert.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{alert.aiObservation}</p>
                      </Link>
                    ))}
                    {unreviewedAlertsCount === 0 && (
                      <p className="text-xs text-slate-500 text-center py-4">No unreviewed alerts.</p>
                    )}
                  </div>
                  <Link
                    to="/app/alerts"
                    onClick={() => setNotificationsOpen(false)}
                    className="block text-center text-xs font-bold text-teal-600 hover:underline pt-1"
                  >
                    View All AI Observations →
                  </Link>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
              >
                <img
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"
                  alt="Avatar"
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
                />
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-tight">Joecel Garcia</p>
                  <p className="text-[10px] text-purple-700 font-extrabold">Super Admin</p>
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-2 space-y-1">
                  <div className="p-2 border-b border-slate-100">
                    <p className="font-bold text-xs text-slate-900">Joecel Garcia</p>
                    <p className="text-[11px] text-slate-500">joecelgarcia1@gmail.com</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-extrabold">
                      Super Admin Role
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
                    onClick={handleLogout}
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

        {/* PAGE CONTENT CONTAINER */}
        <main key={location.pathname} className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 animate-fade-in">
          {children}
        </main>
      </div>

      <AIAssistantModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />
      <ToastContainer />
    </div>
  );
};

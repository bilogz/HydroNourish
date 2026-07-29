import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { Menu, X, LayoutDashboard, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Logo />

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <a href="#home" className="hover:text-teal-600 transition-colors">Home</a>
          <a href="#features" className="hover:text-teal-600 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-teal-600 transition-colors">How It Works</a>
          <a href="#about" className="hover:text-teal-600 transition-colors">About</a>
          <a href="#contact" className="hover:text-teal-600 transition-colors">Contact</a>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/admin/login"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
          >
            <LogIn className="w-4 h-4 text-slate-500" />
            {isAdmin ? 'Dashboard' : 'Admin Login'}
          </Link>
          <button
            onClick={() => navigate('/app')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all hover:scale-[1.02] flex items-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            Open Dashboard
          </button>
        </div>

        {/* Mobile menu toggle */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <a
            href="#home"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
          >
            Home
          </a>
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
          >
            How It Works
          </a>
          <a
            href="#about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
          >
            About
          </a>
          <a
            href="#contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
          >
            Contact
          </a>
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            <Link
              to="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
            >
              {isAdmin ? 'Dashboard' : 'Admin Login'}
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/app');
              }}
              className="w-full text-center py-2.5 rounded-xl bg-teal-600 text-white font-semibold shadow-sm"
            >
              Open Dashboard
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

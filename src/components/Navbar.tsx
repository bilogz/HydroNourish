import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { Menu, X, LayoutDashboard, LogIn, UserCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const isOwnerLoggedIn = !!localStorage.getItem('hn_owner_email');

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Logo />

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <a href="#home" className="hover:text-rose-600 transition-colors">Home</a>
          <a href="#features" className="hover:text-rose-600 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-rose-600 transition-colors">How It Works</a>
          <a href="#about" className="hover:text-rose-600 transition-colors">About</a>
          <a href="#contact" className="hover:text-rose-600 transition-colors">Contact</a>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isOwnerLoggedIn ? (
            <Link
              to="/owner"
              className="px-4.5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <UserCheck className="w-4 h-4" />
              My Owner Dashboard
            </Link>
          ) : (
            <Link
              to="/owner/login"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-700 via-rose-600 to-pink-600 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all hover:scale-[1.02] flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              Pet Owner Portal
            </Link>
          )}
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
            {isOwnerLoggedIn ? (
              <Link
                to="/owner"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-rose-600 font-extrabold text-white shadow-sm"
              >
                My Owner Dashboard
              </Link>
            ) : (
              <Link
                to="/owner/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-rose-600 font-extrabold text-white shadow-sm"
              >
                Pet Owner Portal (Login / Register)
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

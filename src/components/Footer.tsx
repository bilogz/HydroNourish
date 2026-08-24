import React, { useState } from 'react';
import { Logo } from './Logo';
import { Modal } from './Modal';
import { Heart, MapPin, Phone, Mail, ShieldAlert } from 'lucide-react';

export const Footer: React.FC = () => {
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Col 1: Logo & Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="bg-white/95 p-2 rounded-2xl inline-block shadow-xs">
              <Logo size="md" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated pet feeding, smart hydration tracking, and AI-assisted consumption telemetry tailored for Heritage Animal Clinic.
            </p>
            <div className="flex items-center gap-2 text-xs text-rose-400 font-semibold pt-1">
              <Heart className="w-4 h-4 fill-rose-400" />
              Capstone Project Presentation Ready
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#home" className="hover:text-rose-400 transition-colors">Home</a></li>
              <li><a href="#features" className="hover:text-rose-400 transition-colors">System Features</a></li>
              <li><a href="#how-it-works" className="hover:text-rose-400 transition-colors">How It Works</a></li>
              <li><a href="#about" className="hover:text-rose-400 transition-colors">About Project</a></li>
              <li><a href="#contact" className="hover:text-rose-400 transition-colors">Contact Clinic</a></li>
            </ul>
          </div>

          {/* Col 3: Heritage Animal Clinic */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Heritage Animal Clinic</h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>742 Evergreen Terrace, Medical District, Sector 4</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-rose-400 shrink-0" />
                <span>(555) 890-1234</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-rose-400 shrink-0" />
                <span>contact@heritageanimalclinic.com</span>
              </p>
            </div>
          </div>

          {/* Col 4: Medical Disclaimer Summary */}
          <div className="space-y-3 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              Veterinary Notice
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              HydroNourish provides monitoring and AI-assisted observations to support veterinary staff. It does not replace professional veterinary diagnosis or treatment.
            </p>
          </div>
        </div>

        {/* Bottom copyright and policies */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 HydroNourish — Heritage Animal Clinic. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setPrivacyModalOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setTermsModalOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Terms of Use
            </button>
          </div>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      <Modal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
        title="Privacy Policy — HydroNourish"
        subtitle="Heritage Animal Clinic Data Handling Practices"
      >
        <div className="space-y-3 text-xs text-slate-600 leading-relaxed max-h-96 overflow-y-auto pr-1">
          <p className="font-semibold text-slate-900">1. Data Collection</p>
          <p>HydroNourish collects telemetry data transmitted by connected smart feeders and hydration fountains (including weight, food consumption, and water intake).</p>
          <p className="font-semibold text-slate-900">2. Medical Use Only</p>
          <p>All collected telemetry is strictly restricted to authorized Heritage Animal Clinic veterinary staff and pet owners for healthcare evaluation.</p>
          <p className="font-semibold text-slate-900">3. Local Mock Demonstration</p>
          <p>This version of HydroNourish operates using local state for demonstration purposes.</p>
        </div>
      </Modal>

      {/* Terms Modal */}
      <Modal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        title="Terms of Use — HydroNourish"
        subtitle="System Operating Guidelines"
      >
        <div className="space-y-3 text-xs text-slate-600 leading-relaxed max-h-96 overflow-y-auto pr-1">
          <p className="font-semibold text-slate-900">1. Clinical Decision Support</p>
          <p>HydroNourish is designed solely as a supportive monitoring system for Heritage Animal Clinic. Automated AI observations must be validated by a licensed veterinarian before initiating treatment.</p>
          <p className="font-semibold text-slate-900">2. Emergency Protocols</p>
          <p>In case of acute medical distress, pet owners must bring their pets immediately to Heritage Animal Clinic or an emergency veterinary hospital.</p>
        </div>
      </Modal>
    </footer>
  );
};

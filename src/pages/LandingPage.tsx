import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import {
  Utensils,
  Droplets,
  Activity,
  Bot,
  Cpu,
  FileSpreadsheet,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Send,
  Sparkles,
  Heart,
  Calendar,
  Smartphone,
  Check,
  Flame
} from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, addInquiry } = useAppContext();

  // Contact form local state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      showToast('warning', 'Form Incomplete', 'Please fill in all required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      await addInquiry({
        name: contactName.trim(),
        email: contactEmail.trim(),
        subject: contactSubject.trim() || 'General Inquiry',
        message: contactMessage.trim(),
      });
      setSubmitted(true);
    } catch {
      showToast('error', 'Error', 'Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      {/* ================= 1. HERO SECTION ================= */}
      <section id="home" className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden bg-gradient-to-b from-slate-50 via-rose-50/40 to-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Smarter Feeding, Hydration, and Health Monitoring for <span className="clinic-gradient-text">Pets</span>
          </h1>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            HydroNourish helps Heritage Animal Clinic monitor pet nutrition and water consumption through one connected platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/owner/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-rose-700 via-rose-600 to-pink-600 text-white font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2.5 text-center"
            >
              Pet Owner Portal
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 transition-colors text-base text-center"
            >
              Learn More
            </a>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-rose-600" /> Real-time telemetry</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-rose-600" /> ESP32 hardware support</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-rose-600" /> AI observations</span>
          </div>
        </div>
      </section>

      {/* ================= 2. MAIN FEATURES ================= */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-rose-600">Core Capabilities</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Integrated Technology for Heritage Animal Clinic
            </p>
            <p className="text-sm text-slate-600">
              Designed to connect hardware feeders and smart hydration dispensers into a single dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="clinic-card p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 w-fit">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Automated Pet Feeding</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Schedule customized meal portions, monitor food dispenser levels, and dispense meals automatically or manually.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="clinic-card p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-sky-50 text-sky-600 w-fit">
                <Droplets className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Smart Hydration Monitoring</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Track daily water intake volume, view water level gauges, and receive low-water alerts for patient refill management.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="clinic-card p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 w-fit">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">AI-Assisted Health Alerts</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Intelligent anomaly detection algorithms flag possible abnormal hydration or dietary intake patterns for veterinary review.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="clinic-card p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-100 text-slate-700 w-fit">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Real-Time Device Tracking</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Monitor online connectivity status, Wi-Fi signal strength, battery levels, and telemetry output from ESP32 nodes.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="clinic-card p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600 w-fit">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Reports and Health History</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generate printable clinical summaries, export CSV records, and analyze long-term nutrition and intake trends per patient.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="clinic-card p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-600 w-fit">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Owner Portal & Direct Inquiries</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enable pet owners to view live intake telemetry, monitor patient recovery, and message veterinary clinic staff directly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 4. HOW IT WORKS ================= */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-rose-600">Workflow</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Four Steps to Complete Care Tracking
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white font-extrabold flex items-center justify-center mx-auto text-lg">
                1
              </div>
              <h4 className="text-base font-bold text-slate-900">Register the Pet</h4>
              <p className="text-xs text-slate-600">
                Input pet details, breed, weight, owner reference, and clinical dietary plan.
              </p>
            </div>

            <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white font-extrabold flex items-center justify-center mx-auto text-lg">
                2
              </div>
              <h4 className="text-base font-bold text-slate-900">Connect Device</h4>
              <p className="text-xs text-slate-600">
                Pair the smart feeder and hydration dispenser units.
              </p>
            </div>

            <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white font-extrabold flex items-center justify-center mx-auto text-lg">
                3
              </div>
              <h4 className="text-base font-bold text-slate-900">Collect Readings</h4>
              <p className="text-xs text-slate-600">
                Automated sensors transmit intake volumes and fluid telemetry continuously.
              </p>
            </div>

            <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white font-extrabold flex items-center justify-center mx-auto text-lg">
                4
              </div>
              <h4 className="text-base font-bold text-slate-900">Review Results & Alerts</h4>
              <p className="text-xs text-slate-600">
                Veterinary staff evaluate dashboard trends, print reports, and review AI alerts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 5. SAFETY STATEMENT BANNER ================= */}
      <section className="py-10 bg-amber-500/10 border-y border-amber-200">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-amber-800 font-bold text-sm uppercase tracking-wider">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            Clinical Safety Statement
          </div>
          <p className="text-sm sm:text-base text-amber-950 font-medium leading-relaxed max-w-3xl mx-auto">
            “HydroNourish provides monitoring and AI-assisted observations to support veterinary staff. It does not replace professional veterinary diagnosis or treatment.”
          </p>
        </div>
      </section>

      {/* ================= 6. ABOUT SECTION ================= */}
      <section id="about" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-rose-600">About HydroNourish</h2>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Designed specifically for Heritage Animal Clinic
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                HydroNourish was created as a capstone project to address real-world challenges in animal clinic patient care. In veterinary clinic wards and boarding facilities, tracking exact food intake and water consumption can be labor-intensive.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                By integrating smart hardware dispensers (powered by ESP32 microcontrollers) with a clean, centralized web application dashboard, HydroNourish empowers veterinary staff to make informed, data-driven decisions while ensuring patients maintain healthy hydration and nutrition.
              </p>
            </div>

            <div className="clinic-card p-6 bg-white space-y-4">
              <h4 className="text-base font-bold text-slate-900">System Architecture Highlights</h4>
              <ul className="space-y-3 text-xs text-slate-600">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Microcontroller Telemetry:</strong> Micro-dispensing servos and load cells transmit load weight changes to the server.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>AI Anomaly Flagging:</strong> Machine-learning algorithms flag deviations from historical baseline water/food consumption.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Supabase-Ready Database Schema:</strong> Ready for real-time Postgres DB synchronization.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 7. CONTACT SECTION ================= */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-rose-600">Contact Us</h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Get in Touch with Heritage Animal Clinic
            </h3>
            <p className="text-sm text-slate-500">
              Have questions regarding the HydroNourish platform or patient monitoring setup?
            </p>
          </div>

          <div className="clinic-card p-8 bg-slate-50/50">
            {submitted ? (
              <div className="p-8 text-center space-y-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-lg font-bold text-emerald-900">Message Received Successfully!</h4>
                <p className="text-xs text-emerald-700">
                  Thank you for reaching out, {contactName}. Heritage Animal Clinic staff will review your inquiry shortly.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setContactName('');
                    setContactEmail('');
                    setContactSubject('');
                    setContactMessage('');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs mt-2"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Jane Doe"
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:border-rose-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. jane@example.com"
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:border-rose-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Inquiry regarding HydroNourish setup"
                    value={contactSubject}
                    onChange={e => setContactSubject(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:border-rose-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Write your message here..."
                    value={contactMessage}
                    onChange={e => setContactMessage(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:border-rose-500 focus:bg-white focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                  {isSubmitting ? 'Sending Inquiry...' : 'Submit Contact Form'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

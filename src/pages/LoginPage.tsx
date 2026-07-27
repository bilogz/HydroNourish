import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { useAppContext } from '../hooks/useAppContext';
import { Modal } from '../components/Modal';
import { LogIn, ArrowLeft, KeyRound, Sparkles, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, showToast } = useAppContext();

  const [email, setEmail] = useState('s.jenkins@heritageanimalclinic.com');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login();
    navigate('/app');
  };

  const handleDemoLogin = () => {
    setEmail('s.jenkins@heritageanimalclinic.com');
    setPassword('demo-vet-password');
    login();
    navigate('/app');
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotModalOpen(false);
    showToast('info', 'Password Reset Request', `A reset link has been dispatched to ${forgotEmail || email}.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 sm:p-6 text-slate-800">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden">
        {/* Top Header Card */}
        <div className="p-8 bg-slate-50 border-b border-slate-100 text-center space-y-3">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Heritage Animal Clinic Staff Portal
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-xs font-medium rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                placeholder="staff@heritageanimalclinic.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotModalOpen(true);
                  }}
                  className="text-xs font-semibold text-teal-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-xs font-medium rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                placeholder="Enter password"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                />
                <span className="text-xs text-slate-600 font-medium">Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign In to Dashboard
            </button>
          </form>

          {/* Quick Demo Login Button */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-teal-600" />
              Quick Demo Account Sign In (Dr. Sarah Jenkins)
            </button>

            <div className="text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Public Landing Page
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Reset Account Password"
        subtitle="Heritage Animal Clinic Veterinary Portal"
      >
        <form onSubmit={handleForgotSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Enter your clinic email address below. We will send a secure password reset link to verify your identity.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              className="w-full px-4 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none"
              placeholder="name@heritageanimalclinic.com"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setForgotModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700"
            >
              Send Reset Link
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

/**
 * HydroNourish — Email Diagnostic & System Status Modal
 * Heritage Animal Clinic Capstone Project
 *
 * Diagnoses production email dispatch failures (e.g., HTTP 401 invalid API keys on Vercel),
 * displays real-time service status, and provides troubleshooting instructions.
 */

import React from 'react';
import {
  AlertTriangle,
  Server,
  Key,
  Globe,
  CheckCircle,
  XCircle,
  X,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export interface DiagnosticData {
  recipientEmail: string;
  supabaseStatus?: string;
  formSubmitStatus?: string;
  errorMessage?: string;
  generatedCode?: string;
}

interface EmailDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DiagnosticData;
  onProceedWithCode?: (code: string) => void;
}

export const EmailDiagnosticModal: React.FC<EmailDiagnosticModalProps> = ({
  isOpen,
  onClose,
  data,
  onProceedWithCode,
}) => {
  if (!isOpen) return null;

  const isSupabase401 = data.supabaseStatus?.includes('401') || data.supabaseStatus?.includes('Invalid');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-amber-600 to-red-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
              <AlertTriangle className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight">System Diagnostic Notice</h3>
              <p className="text-xs text-amber-100 font-medium">Production Email Service & API Check</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-slate-700 max-h-[75vh] overflow-y-auto">
          {/* Main Error Callout */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-sm space-y-2">
            <div className="flex items-center space-x-2 font-bold text-amber-800">
              <Server className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Email Delivery Diagnostics for {data.recipientEmail}</span>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              The application attempted to dispatch your 2FA verification code, but an environment or service error was detected on the hosting server.
            </p>
          </div>

          {/* Service Status Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Service Status Breakdown</h4>
            
            {/* Supabase Service Row */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between space-x-3">
              <div className="flex items-start space-x-3">
                {isSupabase401 ? (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <span>Supabase Auth API</span>
                    {isSupabase401 && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-red-100 text-red-700">
                        HTTP 401 UNAUTHORIZED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {data.supabaseStatus || 'Checking connection...'}
                  </p>
                </div>
              </div>
            </div>

            {/* FormSubmit API Row */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between space-x-3">
              <div className="flex items-start space-x-3">
                <Globe className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">FormSubmit Email Service</div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {data.formSubmitStatus || 'Secondary email dispatcher fallback'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Root Cause & Vercel Fix Guidance */}
          {isSupabase401 && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-2 text-xs text-red-800">
              <div className="flex items-center space-x-2 font-bold text-red-900">
                <Key className="w-4 h-4 text-red-600" />
                <span>How to Fix Missing Environment Variables on Vercel</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-red-700 leading-relaxed pl-1">
                <li>Log into your <strong>Vercel Dashboard</strong>.</li>
                <li>Go to <strong>HydroNourish → Settings → Environment Variables</strong>.</li>
                <li>Add <code className="bg-red-100 px-1 py-0.5 rounded font-mono text-[11px]">VITE_SUPABASE_URL</code> and <code className="bg-red-100 px-1 py-0.5 rounded font-mono text-[11px]">VITE_SUPABASE_ANON_KEY</code>.</li>
                <li>Click <strong>Redeploy</strong> to apply the new keys.</li>
              </ol>
            </div>
          )}

          {/* Emergency Verification Option */}
          {data.generatedCode && onProceedWithCode && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 font-bold text-emerald-900 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Emergency Diagnostic Verification Code</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-200 text-emerald-800 rounded-full">
                  DIAGNOSTIC MODE
                </span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                While environment keys are being updated, you can use the diagnostic code below to complete sign-in:
              </p>
              <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-emerald-200 shadow-sm">
                <span className="font-mono text-xl font-extrabold text-emerald-800 tracking-widest">
                  {data.generatedCode}
                </span>
                <button
                  type="button"
                  onClick={() => onProceedWithCode(data.generatedCode!)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
                >
                  Use Code & Proceed
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            Dismiss Diagnostic
          </button>
        </div>
      </div>
    </div>
  );
};

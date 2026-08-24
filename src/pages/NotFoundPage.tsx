/**
 * HydroNourish — Not Found Page (404)
 * Heritage Animal Clinic Capstone Project
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchX, Home, ArrowLeft } from 'lucide-react';
import { Logo } from '../components/Logo';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 text-center space-y-2">
          <div className="flex justify-center">
            <Logo size="md" />
          </div>
        </div>

        {/* Body */}
        <div className="p-8 text-center space-y-5">
          <div className="p-4 rounded-2xl bg-rose-50 w-fit mx-auto">
            <SearchX className="w-10 h-10 text-rose-500" />
          </div>

          <div className="space-y-2">
            <p className="text-7xl font-black text-slate-200">404</p>
            <h1 className="text-xl font-extrabold text-slate-900 -mt-2">
              Page Not Found
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => navigate(-1)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

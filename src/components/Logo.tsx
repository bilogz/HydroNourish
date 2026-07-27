import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', iconOnly = false, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11'
  };

  const textClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 group focus:outline-none ${className}`}>
      {/* Custom HydroNourish Logo: Droplet combined with Pet Paw */}
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 via-teal-600 to-emerald-500 shadow-sm transition-transform group-hover:scale-105 ${sizeClasses[size]}`}>
        <svg viewBox="0 0 100 100" fill="none" className="w-4/5 h-4/5 text-white">
          {/* Water Droplet outline/fill shape */}
          <path
            d="M50 8 C50 8, 18 50, 18 66 A32 32 0 0 0 82 66 C82 50, 50 8, 50 8 Z"
            fill="currentColor"
            opacity="0.25"
          />
          <path
            d="M50 12 C50 12, 22 52, 22 66 A28 28 0 0 0 78 66 C78 52, 50 12, 50 12 Z"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Pet Paw in center */}
          <ellipse cx="50" cy="70" rx="12" ry="8.5" fill="currentColor" />
          <circle cx="36" cy="55" r="4" fill="currentColor" />
          <circle cx="45" cy="49" r="4.5" fill="currentColor" />
          <circle cx="55" cy="49" r="4.5" fill="currentColor" />
          <circle cx="64" cy="55" r="4" fill="currentColor" />
        </svg>
      </div>

      {!iconOnly && (
        <div className="flex flex-col">
          <span className={`font-extrabold tracking-tight text-slate-900 leading-none ${textClasses[size]}`}>
            Hydro<span className="text-teal-600">Nourish</span>
          </span>
          <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase mt-0.5">
            Heritage Animal Clinic
          </span>
        </div>
      )}
    </Link>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  textClassName?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  iconOnly = false,
  size = 'md',
  showSubtitle = true,
  textClassName = ''
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 group focus:outline-none ${className}`}>
      {/* Official Heritage Animal Clinic Round Logo Badge */}
      <div
        className={`relative flex items-center justify-center rounded-full shrink-0 overflow-hidden shadow-xs ring-2 ring-rose-200/70 group-hover:scale-105 transition-transform duration-200 bg-[#FDB0C0]/15 ${sizeClasses[size]}`}
      >
        <img
          src="/heritage-logo.png"
          alt="Heritage Animal Clinic Logo"
          className="w-full h-full object-contain drop-shadow-2xs"
          loading="eager"
        />
      </div>

      {!iconOnly && (
        <div className="flex flex-col">
          <span className={`font-extrabold tracking-tight text-slate-900 leading-none ${textClasses[size]} ${textClassName}`}>
            Hydro<span className="text-rose-600 font-black">Nourish</span>
          </span>
          {showSubtitle && (
            <span className="text-[10px] font-bold tracking-wider text-rose-900/80 uppercase mt-0.5">
              Heritage Animal Clinic
            </span>
          )}
        </div>
      )}
    </Link>
  );
};


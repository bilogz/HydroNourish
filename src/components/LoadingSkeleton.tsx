import React from 'react';

interface LoadingSkeletonProps {
  type?: 'card' | 'table' | 'profile' | 'page' | 'chart';
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'card', count = 3 }) => {
  const items = Array.from({ length: count });

  if (type === 'table') {
    return (
      <div className="clinic-card overflow-hidden animate-fade-in">
        <div className="h-12 skeleton-shimmer border-b border-slate-200" />
        {items.map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl skeleton-shimmer shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 skeleton-shimmer rounded w-1/4" />
              <div className="h-3 skeleton-shimmer rounded w-1/2" />
            </div>
            <div className="w-20 h-7 skeleton-shimmer rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="clinic-card p-6 space-y-4 animate-fade-in">
        <div className="flex justify-between items-center">
          <div className="h-5 skeleton-shimmer rounded w-1/3" />
          <div className="h-8 skeleton-shimmer rounded-xl w-24" />
        </div>
        <div className="h-64 skeleton-shimmer rounded-2xl w-full" />
      </div>
    );
  }

  if (type === 'page') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="clinic-card p-5 space-y-3">
              <div className="flex justify-between">
                <div className="h-3 skeleton-shimmer rounded w-1/2" />
                <div className="w-10 h-10 rounded-xl skeleton-shimmer" />
              </div>
              <div className="h-7 skeleton-shimmer rounded w-2/3" />
            </div>
          ))}
        </div>
        <div className="clinic-card p-6 space-y-4">
          <div className="h-5 skeleton-shimmer rounded w-1/4" />
          <div className="h-48 skeleton-shimmer rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in">
      {items.map((_, i) => (
        <div key={i} className="clinic-card p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <div className="h-3 skeleton-shimmer rounded w-1/3" />
              <div className="h-6 skeleton-shimmer rounded w-1/2" />
            </div>
            <div className="w-10 h-10 rounded-xl skeleton-shimmer" />
          </div>
          <div className="h-3 skeleton-shimmer rounded w-3/4" />
        </div>
      ))}
    </div>
  );
};

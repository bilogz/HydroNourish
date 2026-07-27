export const formatTemperature = (tempC: number): string => {
  return `${tempC.toFixed(1)}°C (${((tempC * 9) / 5 + 32).toFixed(1)}°F)`;
};

export const formatHeartRate = (bpm: number): string => {
  return `${bpm} bpm`;
};

export const formatWeight = (kg: number): string => {
  return `${kg.toFixed(1)} kg (${(kg * 2.20462).toFixed(1)} lbs)`;
};

export const formatHydration = (ml: number): string => {
  if (ml >= 1000) {
    return `${(ml / 1000).toFixed(2)} L`;
  }
  return `${ml} ml`;
};

export const getHealthBadgeColor = (status: 'Healthy' | 'Attention Needed' | 'Critical' | string) => {
  switch (status) {
    case 'Healthy':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Attention Needed':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Critical':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

export const getSeverityBadgeColor = (severity: 'Info' | 'Warning' | 'Critical') => {
  switch (severity) {
    case 'Info':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'Warning':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Critical':
      return 'bg-rose-50 text-rose-700 border-rose-200';
  }
};

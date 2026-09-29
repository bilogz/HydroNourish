/**
 * ============================================================================
 * HYDRONOURISH — AI PET BEHAVIOR & HABIT LEARNING CENTER WIDGET
 * ============================================================================
 * High-aesthetic interactive neural dashboard widget displaying:
 * 1. Live AI Learning Stage & Model Confidence Score
 * 2. Learned Eating Kinetics (Pace in g/s & Adaptive Gate Window)
 * 3. Circadian Hunger & Hydration Rhythms (Peak hours & predicted next meal)
 * 4. Online Training Sessions Count & Retrain/Synthesize Trigger
 * ============================================================================
 */

import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  Zap,
  Clock,
  Utensils,
  Droplets,
  Activity,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Layers,
  ChevronRight,
  Sliders,
  Check
} from 'lucide-react';
import { useAppContext } from '../../hooks/useAppContext';
import { Pet } from '../../types';

interface AiLearningCenterWidgetProps {
  pet?: Pet;
  compact?: boolean;
  className?: string;
}

export const AiLearningCenterWidget: React.FC<AiLearningCenterWidgetProps> = ({
  pet,
  compact = false,
  className = '',
}) => {
  const {
    aiLearningProfile,
    trainAiModelNow,
    feedingLogs,
    hydrationLogs,
    devices
  } = useAppContext();

  const [isRetraining, setIsRetraining] = useState(false);

  const activePetName = pet?.name || aiLearningProfile?.petName || 'Max';
  const activeSpecies = pet?.species || aiLearningProfile?.species || 'Canine (Dog)';
  const confidence = aiLearningProfile?.modelConfidenceScore || 92;
  const stage = aiLearningProfile?.learningStage || 'Adaptive Tuning';
  const pace = aiLearningProfile?.learnedEatingPaceGps || 1.8;
  const gateWindow = aiLearningProfile?.recommendedAdaptiveGateWindowSec || 45;
  const mealDuration = aiLearningProfile?.averageMealDurationSeconds || 36;
  const totalMeals = aiLearningProfile?.totalMealsAnalyzed ?? (feedingLogs?.length || 0);
  const totalHydrations = aiLearningProfile?.totalHydrationsAnalyzed ?? (hydrationLogs?.length || 0);
  const nextMeal = aiLearningProfile?.predictedNextMealTime || '06:00 PM';
  const nextDrink = aiLearningProfile?.predictedNextDrinkTime || '06:15 PM';

  const handleRetrain = async () => {
    setIsRetraining(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    trainAiModelNow();
    setIsRetraining(false);
  };

  const getStageBadgeColor = (st: string) => {
    switch (st) {
      case 'Fully Trained':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Adaptive Tuning':
        return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      case 'Pattern Recognition':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-slate-900/90 via-purple-950/20 to-slate-950 p-5 shadow-2xl backdrop-blur-md ${className}`}>
      {/* Background Neural Glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl"></div>
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-teal-600/10 blur-3xl"></div>

      {/* Header Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-teal-500/20 border border-purple-500/30 shadow-inner">
            <Brain className="h-6 w-6 text-purple-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                AI Behavior & Habit Learning
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full border border-purple-400/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                <Sparkles className="h-2.5 w-2.5" />
                ONLINE LEARNING
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Continuously learning feeding kinetics & hydration habits for <span className="font-semibold text-slate-200">{activePetName}</span> ({activeSpecies})
            </p>
          </div>
        </div>

        {/* Action Controls & Stage Badge */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ${getStageBadgeColor(stage)}`}>
            <Activity className="h-3.5 w-3.5 animate-pulse" />
            <span>{stage.toUpperCase()}</span>
            <span className="rounded-md bg-slate-950/40 px-1.5 py-0.5 font-mono text-[10px] font-bold">
              {confidence}%
            </span>
          </div>

          <button
            onClick={handleRetrain}
            disabled={isRetraining}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-all hover:border-purple-500/50 hover:bg-purple-900/30 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
            title="Trigger instant AI synthesis across all historical sessions"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-purple-400 ${isRetraining ? 'animate-spin' : ''}`} />
            <span>{isRetraining ? 'Synthesizing...' : 'Synthesize Habits'}</span>
          </button>
        </div>
      </div>

      {/* Grid of Learned Parameters */}
      <div className="relative z-10 mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Learned Eating Pace & Adaptive Gate Window */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 transition-all hover:border-teal-500/30 hover:bg-slate-900/90 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-semibold text-teal-300">
              <Utensils className="h-3.5 w-3.5 text-teal-400" />
              Adaptive Feeder Gate
            </span>
            <span className="font-mono text-[10px] text-emerald-400 font-bold">ACTIVE</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-100 font-mono">{gateWindow}s</span>
            <span className="text-[11px] text-slate-400">hold window</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] border-t border-slate-800/70 pt-2 text-slate-400">
            <span>Learned Pace:</span>
            <span className="font-mono font-bold text-teal-300">{pace} g/s</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>Avg Session:</span>
            <span className="font-mono font-semibold text-slate-300">{mealDuration}s</span>
          </div>
        </div>

        {/* Metric 2: Circadian Hunger Rhythm */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 transition-all hover:border-amber-500/30 hover:bg-slate-900/90 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-semibold text-amber-300">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              Circadian Hunger
            </span>
            <span className="font-mono text-[10px] text-amber-400 font-bold">PREDICTIVE</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-100 font-mono">{nextMeal}</span>
            <span className="text-[11px] text-slate-400">predicted</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1 border-t border-slate-800/70 pt-2">
            {(aiLearningProfile?.peakHungerWindows || [
              { hour: 8, label: '08:00 AM', probability: 92 },
              { hour: 18, label: '06:00 PM', probability: 88 }
            ]).slice(0, 2).map((w, idx) => (
              <span key={idx} className="rounded-md bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[10px] font-mono text-amber-300">
                {w.label} ({w.probability}%)
              </span>
            ))}
          </div>
        </div>

        {/* Metric 3: Hydration Rhythm & Intake */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 transition-all hover:border-sky-500/30 hover:bg-slate-900/90 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-semibold text-sky-300">
              <Droplets className="h-3.5 w-3.5 text-sky-400" />
              Hydration Rhythm
            </span>
            <span className="font-mono text-[10px] text-sky-400 font-bold">RHYTHM</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-100 font-mono">
              {aiLearningProfile?.averageWaterIntakeMl || 45} ml
            </span>
            <span className="text-[11px] text-slate-400">/ session</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] border-t border-slate-800/70 pt-2 text-slate-400">
            <span>Post-Meal Delay:</span>
            <span className="font-mono font-bold text-sky-300">~{aiLearningProfile?.eatingToDrinkingDelayMinutes || 3.2}m</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>Next Hydration:</span>
            <span className="font-mono font-semibold text-slate-300">{nextDrink}</span>
          </div>
        </div>

        {/* Metric 4: Total Sessions & Reinforcement Stage */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 transition-all hover:border-purple-500/30 hover:bg-slate-900/90 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-semibold text-purple-300">
              <Layers className="h-3.5 w-3.5 text-purple-400" />
              Trained Dataset
            </span>
            <span className="font-mono text-[10px] text-purple-400 font-bold">ONLINE</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-200 font-mono">
              {totalMeals + totalHydrations}
            </span>
            <span className="text-[11px] text-slate-400">total events</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] border-t border-slate-800/70 pt-2 text-slate-400">
            <span>Meals Learned:</span>
            <span className="font-mono font-bold text-teal-300">{totalMeals}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>Drinks Learned:</span>
            <span className="font-mono font-bold text-sky-300">{totalHydrations}</span>
          </div>
        </div>
      </div>

      {/* Dynamic Behavioral Observations & Recommendations */}
      {!compact && (
        <div className="relative z-10 mt-4 rounded-2xl border border-slate-800/90 bg-slate-950/60 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>Learned Behavioral Insights & Adaptive Calibration</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {(aiLearningProfile?.behavioralInsights || [
              `Circadian Rhythm: ${activePetName}'s appetite clusters around morning & evening windows.`,
              `Eating Kinetics: Consumes steady portion at ${pace} g/s without rush.`,
              `Hydration Pattern: Drinks water within ~3.2 minutes following meal completion.`
            ]).slice(0, 3).map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2 rounded-xl bg-slate-900/60 border border-slate-800/60 p-2.5 text-xs text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-400 mt-0.5 shrink-0" />
                <span>{insight}</span>
              </div>
            ))}

            {(aiLearningProfile?.adaptiveRecommendations || [
              `Gate Hold Window: Adjusted dynamically to ${gateWindow}s for natural, unhurried eating.`,
              `Appetite Forecast: Next predicted meal window is ${nextMeal}.`
            ]).slice(0, 1).map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 rounded-xl bg-purple-950/30 border border-purple-800/30 p-2.5 text-xs text-purple-200">
                <Brain className="h-3.5 w-3.5 text-purple-400 mt-0.5 shrink-0" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

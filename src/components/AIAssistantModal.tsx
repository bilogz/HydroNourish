import React, { useState } from 'react';
import { Modal } from './Modal';
import { StatusBadge } from './StatusBadge';
import { useAppContext } from '../hooks/useAppContext';
import { analyzePetTelemetry, AIObservationResult } from '../services/aiService';
import { Bot, Sparkles, RefreshCw, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
  const { pets, showToast } = useAppContext();

  const [selectedPetId, setSelectedPetId] = useState<string>(pets[0]?.id || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIObservationResult | null>(null);

  const selectedPet = pets.find(p => p.id === selectedPetId) || pets[0];

  const handleRunAnalysis = async () => {
    if (!selectedPet) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);

    const result = await analyzePetTelemetry({
      name: selectedPet.name,
      species: selectedPet.species,
      breed: selectedPet.breed,
      age: selectedPet.age,
      weightKg: selectedPet.weight,
      temperatureC: selectedPet.latestVitals.temperature,
      heartRateBpm: selectedPet.latestVitals.heartRate,
      waterConsumedMl: 450,
      waterTargetMl: selectedPet.hydrationTarget
    });

    setAnalysisResult(result);
    setIsAnalyzing(false);
    showToast('info', 'AI Analysis Complete', `Generated observation via ${result.provider}.`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Clinical Health Assistant"
      subtitle="Google Gemini 1.5 Flash with OpenAI GPT-4o-mini Backup"
      maxWidth="lg"
    >
      <div className="space-y-5 text-xs">
        {/* Active Provider Indicator Bar */}
        <div className="p-3 rounded-xl bg-slate-900 text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-teal-400" />
            <span className="font-bold">Provider Chain:</span>
            <span className="text-teal-400 font-mono">Gemini 1.5 ➔ OpenAI Backup ➔ Local Engine</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px]">
            Ready
          </span>
        </div>

        {/* Patient Selection & Run Action */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 uppercase mb-1">Select Patient Pet *</label>
            <select
              value={selectedPetId}
              onChange={e => setSelectedPetId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white text-xs"
            >
              {pets.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.species} - {p.id}) • {p.healthStatus}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 text-white font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Run AI Check
              </>
            )}
          </button>
        </div>

        {/* Selected Pet Telemetry Summary Card */}
        {selectedPet && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Body Temp</span>
              <p className="font-bold text-slate-900 mt-0.5">{selectedPet.latestVitals.temperature}°C</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Heart Rate</span>
              <p className="font-bold text-slate-900 mt-0.5">{selectedPet.latestVitals.heartRate} bpm</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Weight</span>
              <p className="font-bold text-slate-900 mt-0.5">{selectedPet.weight} kg</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Target Intake</span>
              <p className="font-bold text-teal-600 mt-0.5">{selectedPet.hydrationTarget} ml</p>
            </div>
          </div>
        )}

        {/* AI Output Card */}
        {analysisResult && (
          <div className="clinic-card p-5 space-y-3 bg-white border-teal-200 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold border border-teal-200 text-[10px]">
                  Provider: {analysisResult.provider}
                </span>
              </div>
              <StatusBadge status={analysisResult.severity} size="sm" />
            </div>

            <div>
              <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">Clinical Observation</h4>
              <p className="text-slate-700 leading-relaxed font-medium">{analysisResult.observationText}</p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h4 className="font-bold text-teal-700 uppercase text-[10px] tracking-wider mb-1">Recommended Action</h4>
              <p className="text-slate-700 font-semibold">{analysisResult.recommendedAction}</p>
            </div>

            <div className="pt-2 flex justify-between items-center text-[10px] text-slate-400">
              <span>Observation timestamp: {analysisResult.timestamp}</span>
              <span className="font-bold text-amber-700">Supportive Decision Tool</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

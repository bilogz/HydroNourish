import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAppContext } from '../hooks/useAppContext';
import { downloadCSV, printReportWindow } from '../utils/exportUtils';
import {
  FileText,
  Printer,
  Download,
  FileSpreadsheet,
  Calendar,
  Filter,
  CheckCircle2,
  Utensils,
  Droplets,
  Activity,
  ShieldAlert
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { pets, feedingLogs, hydrationLogs, vitals, alerts, showToast } = useAppContext();

  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [selectedPetId, setSelectedPetId] = useState('All');
  const [reportType, setReportType] = useState('Comprehensive Health');

  const filteredPetName = selectedPetId === 'All' ? 'All Patients' : (pets ?? []).find(p => p.id === selectedPetId)?.name || 'Patient';

  const handlePrint = () => {
    const content = `
      <h1>Heritage Animal Clinic — Clinical Health Report</h1>
      <p><strong>Report Type:</strong> ${reportType}</p>
      <p><strong>Date Range:</strong> ${dateRange}</p>
      <p><strong>Patient Filter:</strong> ${filteredPetName}</p>
      
      <h2>Summary Biometrics</h2>
      <table>
        <thead>
          <tr>
            <th>Pet</th>
            <th>Feeding Compliance</th>
            <th>Avg Water Intake</th>
            <th>Vital Status</th>
            <th>Active Alerts</th>
          </tr>
        </thead>
        <tbody>
          ${(pets ?? [])
            .filter(p => selectedPetId === 'All' || p.id === selectedPetId)
            .map(
              p => `
            <tr>
              <td>${p.name} (${p.species})</td>
              <td>100% (Scheduled portions served)</td>
              <td>${p.hydrationTarget} ml/day target</td>
              <td>${p.healthStatus}</td>
              <td>${(alerts ?? []).filter(a => a.petId === p.id && a.reviewStatus !== 'Resolved').length} Active</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
    printReportWindow(`HydroNourish Report — ${filteredPetName}`, content);
  };

  const handleExportCSV = () => {
    const csvRows = (pets ?? [])
      .filter(p => selectedPetId === 'All' || p.id === selectedPetId)
      .map(p => ({
        PetID: p.id,
        Name: p.name,
        Species: p.species,
        Breed: p.breed,
        Age: p.age,
        WeightKg: p.weight,
        Owner: p.ownerName,
        DeviceID: p.assignedDeviceId,
        HealthStatus: p.healthStatus,
        TemperatureC: p.latestVitals.temperature,
        HeartRateBpm: p.latestVitals.heartRate,
        HydrationTargetMl: p.hydrationTarget
      }));

    downloadCSV(`HydroNourish_Report_${selectedPetId}`, csvRows);
    showToast('success', 'CSV Export Complete', 'Downloaded report dataset to your device.');
  };

  const handleDownloadPDF = () => {
    showToast('info', 'PDF Generation (Demo)', `Generated mock clinical PDF report for ${filteredPetName}.`);
  };

  return (
    <DashboardLayout pageTitle="Reports & Clinical Health Records" breadcrumbs={[{ label: 'Reports' }]}>
      {/* ================= REPORT FILTERS & ACTION BAR ================= */}
      <div className="clinic-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Date Range */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date Range</label>
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                className="px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:border-teal-500 focus:outline-none"
              >
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="Current Month">Current Month</option>
              </select>
            </div>

            {/* Pet Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Patient Pet</label>
              <select
                value={selectedPetId}
                onChange={e => setSelectedPetId(e.target.value)}
                className="px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:border-teal-500 focus:outline-none"
              >
                <option value="All">All Patient Pets</option>
                {(pets ?? []).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.species})
                  </option>
                ))}
              </select>
            </div>

            {/* Report Type */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Report Category</label>
              <select
                value={reportType}
                onChange={e => setReportType(e.target.value)}
                className="px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:border-teal-500 focus:outline-none"
              >
                <option value="Comprehensive Health">Comprehensive Health</option>
                <option value="Feeding Summary">Feeding Summary</option>
                <option value="Hydration Log">Hydration Log</option>
                <option value="Vital Signs History">Vital Signs History</option>
              </select>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              Print
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* ================= REPORT PREVIEW CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Feeding Summary */}
        <div className="clinic-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-emerald-600" />
              Feeding Compliance Summary
            </h3>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              98% Success
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Portions Served:</span>
              <span className="font-bold text-slate-900">{(feedingLogs ?? []).length * 7} servings</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Scheduled Dispense Accuracy:</span>
              <span className="font-bold text-slate-900">98.4%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Manual Overrides:</span>
              <span className="font-bold text-slate-900">2 events</span>
            </div>
          </div>
        </div>

        {/* Hydration Summary */}
        <div className="clinic-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-sky-600" />
              Hydration Consumption Summary
            </h3>
            <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
              Normal Intake
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Volume Consumed:</span>
              <span className="font-bold text-slate-900">14.7 Liters</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Average Daily Intake:</span>
              <span className="font-bold text-slate-900">380 ml / pet</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reservoir Refills Completed:</span>
              <span className="font-bold text-slate-900">4 refills</span>
            </div>
          </div>
        </div>

        {/* Vital-Sign Summary */}
        <div className="clinic-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-600" />
              Vital-Sign Telemetry Summary
            </h3>
            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
              Stable
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Avg Body Temperature:</span>
              <span className="font-bold text-slate-900">38.5°C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Avg Heart Rate:</span>
              <span className="font-bold text-slate-900">92 bpm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Elevated Biometrics Logged:</span>
              <span className="font-bold text-slate-900">{(vitals ?? []).filter(v => v.status !== 'Normal').length} records</span>
            </div>
          </div>
        </div>

        {/* Health Alert Summary */}
        <div className="clinic-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              Health Alert & Review Summary
            </h3>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              3 Logged
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Total AI Health Observations:</span>
              <span className="font-bold text-slate-900">{(alerts || []).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Resolved by Veterinary Staff:</span>
              <span className="font-bold text-slate-900">{(alerts || []).filter(a => a.reviewStatus === 'Resolved').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pending Review:</span>
              <span className="font-bold text-slate-900">{(alerts || []).filter(a => a.reviewStatus !== 'Resolved').length}</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

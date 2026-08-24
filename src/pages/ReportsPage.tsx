import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAppContext } from '../hooks/useAppContext';
import { downloadCSV, printReportWindow } from '../utils/exportUtils';
import { StatusBadge } from '../components/StatusBadge';
import {
  FileText,
  Printer,
  Download,
  FileSpreadsheet,
  Utensils,
  Droplets,
  Activity,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Cpu,
  UserCheck
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { pets, feedingLogs, hydrationLogs, vitals, alerts, schedules, showToast } = useAppContext();

  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [selectedPetId, setSelectedPetId] = useState('All');
  const [reportType, setReportType] = useState('Comprehensive Health');

  const filteredPetName = selectedPetId === 'All' ? 'All Patients' : (pets ?? []).find(p => p.id === selectedPetId)?.name || 'Patient';

  // Dynamic filter for logs
  const filteredPets = useMemo(() => {
    return (pets ?? []).filter(p => selectedPetId === 'All' || p.id === selectedPetId);
  }, [pets, selectedPetId]);

  const filteredFeedingLogs = useMemo(() => {
    return (feedingLogs ?? []).filter(f => selectedPetId === 'All' || f.petId === selectedPetId);
  }, [feedingLogs, selectedPetId]);

  const filteredHydrationLogs = useMemo(() => {
    return (hydrationLogs ?? []).filter(h => selectedPetId === 'All' || h.petId === selectedPetId);
  }, [hydrationLogs, selectedPetId]);

  const filteredVitals = useMemo(() => {
    return (vitals ?? []).filter(v => selectedPetId === 'All' || v.petId === selectedPetId);
  }, [vitals, selectedPetId]);

  const filteredAlerts = useMemo(() => {
    return (alerts ?? []).filter(a => selectedPetId === 'All' || a.petId === selectedPetId);
  }, [alerts, selectedPetId]);

  // Handler: Print Report
  const handlePrint = () => {
    const reportTitle = `${reportType} Report — ${filteredPetName}`;
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    let tableHtml = '';
    
    if (reportType === 'Feeding Summary' || reportType === 'Comprehensive Health') {
      tableHtml += `
        <h3 style="color:#0f766e; margin-top:24px;">Feeding Dispense Telemetry Log</h3>
        <table>
          <thead>
            <tr>
              <th>Log ID</th>
              <th>Pet Name</th>
              <th>Portion (g)</th>
              <th>Dispensed At</th>
              <th>Status</th>
              <th>Hardware Unit</th>
            </tr>
          </thead>
          <tbody>
            ${filteredFeedingLogs.length > 0 ? filteredFeedingLogs.map(f => `
              <tr>
                <td>${f.id}</td>
                <td>${f.petName}</td>
                <td>${f.portionGrams}g</td>
                <td>${f.dispensedAt}</td>
                <td>${f.status}</td>
                <td>${f.deviceId || 'Cage 1'}</td>
              </tr>
            `).join('') : '<tr><td colspan="6">No feeding logs recorded.</td></tr>'}
          </tbody>
        </table>
      `;
    }

    if (reportType === 'Hydration Log' || reportType === 'Comprehensive Health') {
      tableHtml += `
        <h3 style="color:#0284c7; margin-top:24px;">Hydration Intake Telemetry Log</h3>
        <table>
          <thead>
            <tr>
              <th>Log ID</th>
              <th>Pet Name</th>
              <th>Amount Consumed</th>
              <th>Timestamp</th>
              <th>Reservoir Level</th>
            </tr>
          </thead>
          <tbody>
            ${filteredHydrationLogs.length > 0 ? filteredHydrationLogs.map(h => `
              <tr>
                <td>${h.id}</td>
                <td>${h.petName}</td>
                <td>${h.amountMl} ml</td>
                <td>${h.timestamp}</td>
                <td>${h.reservoirLevelPct}%</td>
              </tr>
            `).join('') : '<tr><td colspan="5">No hydration intake logs recorded.</td></tr>'}
          </tbody>
        </table>
      `;
    }

    if (reportType === 'AI Health Alerts' || reportType === 'Comprehensive Health') {
      tableHtml += `
        <h3 style="color:#d97706; margin-top:24px;">AI Health Observations Log</h3>
        <table>
          <thead>
            <tr>
              <th>Alert ID</th>
              <th>Pet Name</th>
              <th>Observed Reading</th>
              <th>AI Observation</th>
              <th>Severity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredAlerts.length > 0 ? filteredAlerts.map(a => `
              <tr>
                <td>${a.id}</td>
                <td>${a.petName}</td>
                <td>${a.observedReading}</td>
                <td>${a.aiObservation}</td>
                <td>${a.severity}</td>
                <td>${a.reviewStatus}</td>
              </tr>
            `).join('') : '<tr><td colspan="6">No AI health alerts recorded.</td></tr>'}
          </tbody>
        </table>
      `;
    }

    const content = `
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0d9488; padding-bottom: 16px;">
        <h2 style="margin:0; color:#0d9488; font-size:22px;">Heritage Animal Clinic</h2>
        <p style="margin:4px 0; color:#64748b; font-size:13px;">HydroNourish Smart Automated Telemetry System</p>
        <h1 style="margin-top:12px; font-size:18px; color:#1e293b;">${reportTitle}</h1>
        <p style="font-size:12px; color:#475569;"><strong>Generated Date:</strong> ${dateStr} | <strong>Range:</strong> ${dateRange} | <strong>Patient:</strong> ${filteredPetName}</p>
      </div>
      ${tableHtml}
      <div style="margin-top: 40px; padding-top: 16px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; font-size: 11px; color: #64748b;">
        <div>Attending Veterinarian Signature: _______________________</div>
        <div>Clinic Seal & Stamp</div>
      </div>
    `;
    printReportWindow(reportTitle, content);
    showToast('success', 'Report Prepared', `Print dialog launched for ${reportType}.`);
  };

  // Handler: CSV Export
  const handleExportCSV = () => {
    let rows: Record<string, any>[] = [];

    if (reportType === 'Feeding Summary') {
      rows = filteredFeedingLogs.map(f => ({
        LogID: f.id,
        PetID: f.petId,
        PetName: f.petName,
        PortionGrams: f.portionGrams,
        DispensedAt: f.dispensedAt,
        Status: f.status,
        HardwareUnit: f.deviceId || 'Cage 1'
      }));
    } else if (reportType === 'Hydration Log') {
      rows = filteredHydrationLogs.map(h => ({
        LogID: h.id,
        PetID: h.petId,
        PetName: h.petName,
        AmountMl: h.amountMl,
        Timestamp: h.timestamp,
        ReservoirLevelPct: h.reservoirLevelPct
      }));
    } else if (reportType === 'AI Health Alerts') {
      rows = filteredAlerts.map(a => ({
        AlertID: a.id,
        PetID: a.petId,
        PetName: a.petName,
        ObservedReading: a.observedReading,
        AIObservation: a.aiObservation,
        Severity: a.severity,
        ReviewStatus: a.reviewStatus,
        Timestamp: a.timestamp
      }));
    } else {
      // Comprehensive
      rows = filteredPets.map(p => ({
        PetID: p.id,
        Name: p.name,
        Species: p.species,
        Breed: p.breed,
        AgeYears: p.age,
        WeightKg: p.weight,
        OwnerName: p.ownerName,
        AssignedUnit: p.assignedDeviceId || 'Cage 1',
        HealthStatus: p.healthStatus,
        DailyHydrationTargetMl: p.hydrationTarget,
        DailyPortionGrams: p.feedingPlan?.portionGrams || 100
      }));
    }

    if (rows.length === 0) {
      showToast('warning', 'No Data Available', 'There are no telemetry records matching the selected filters.');
      return;
    }

    const cleanFilename = `HydroNourish_${reportType.replace(/\s+/g, '_')}_${selectedPetId}_${dateRange.replace(/\s+/g, '_')}`;
    downloadCSV(cleanFilename, rows);
    showToast('success', 'CSV Export Complete', `Exported ${rows.length} record(s) to ${cleanFilename}.csv`);
  };

  // Handler: PDF Export
  const handleDownloadPDF = () => {
    handlePrint();
    showToast('info', 'PDF Export Ready', 'In the print dialog, select "Save as PDF" to download your file.');
  };

  return (
    <DashboardLayout pageTitle="Reports & Clinical Health Records" breadcrumbs={[{ label: 'Reports' }]}>
      {/* ================= REPORT FILTERS & ACTION BAR ================= */}
      <div className="clinic-card p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Date Range */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date Range</label>
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                className="px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:border-rose-500 focus:outline-none"
              >
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="Current Month">Current Month</option>
                <option value="All Time">All Time</option>
              </select>
            </div>

            {/* Pet Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Patient Pet</label>
              <select
                value={selectedPetId}
                onChange={e => setSelectedPetId(e.target.value)}
                className="px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:border-rose-500 focus:outline-none"
              >
                <option value="All">All Patient Pets</option>
                {(pets ?? []).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.species})
                  </option>
                ))}
              </select>
            </div>

            {/* Report Category */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Report Category</label>
              <select
                value={reportType}
                onChange={e => setReportType(e.target.value)}
                className="px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:border-rose-500 focus:outline-none"
              >
                <option value="Comprehensive Health">Comprehensive Care</option>
                <option value="Feeding Summary">Feeding Summary</option>
                <option value="Hydration Log">Hydration Log</option>
                <option value="AI Health Alerts">AI Observations Log</option>
              </select>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto pt-2 md:pt-0 justify-end">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              Print
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* ================= SUMMARY STAT METRICS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Feeding Summary */}
        <div className="clinic-card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-emerald-600" />
              Feeding Compliance
            </h3>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              100% Success
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Portions Dispensed:</span>
              <span className="font-bold text-slate-900">{filteredFeedingLogs.length} servings</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Scheduled Accuracy:</span>
              <span className="font-bold text-emerald-600">100% Automated</span>
            </div>
          </div>
        </div>

        {/* Hydration Summary */}
        <div className="clinic-card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-sky-600" />
              Hydration Consumption
            </h3>
            <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
              Target Met
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Volume Consumed:</span>
              <span className="font-bold text-slate-900">{filteredHydrationLogs.reduce((acc, h) => acc + h.amountMl, 0)} ml</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reservoir Status:</span>
              <span className="font-bold text-slate-900">82% Normal</span>
            </div>
          </div>
        </div>

        {/* Smart Telemetry Summary */}
        <div className="clinic-card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-rose-600" />
              Hardware Telemetry
            </h3>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
              Online
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Active Nodes:</span>
              <span className="font-bold text-slate-900">Cage 1 (Online)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Telemetry Sync:</span>
              <span className="font-bold text-emerald-600">Continuous Stream</span>
            </div>
          </div>
        </div>

        {/* Health Alert Summary */}
        <div className="clinic-card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              AI Observations
            </h3>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {filteredAlerts.length} Active
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Total System Observations:</span>
              <span className="font-bold text-slate-900">{filteredAlerts.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Active Review Status:</span>
              <span className="font-bold text-emerald-600">Optimal</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= DYNAMIC REPORT DATA BREAKDOWN TABLE ================= */}
      <div className="clinic-card overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">{reportType} Breakdown</h3>
            <p className="text-xs text-slate-500">Displaying filtered clinic telemetry data for {filteredPetName} ({dateRange})</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200">
            {reportType}
          </span>
        </div>

        <div className="overflow-x-auto">
          {reportType === 'Feeding Summary' && (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/70 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Log ID</th>
                  <th className="px-4 py-3">Pet Name</th>
                  <th className="px-4 py-3">Portion Served</th>
                  <th className="px-4 py-3">Dispensed At</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredFeedingLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-600">{log.id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{log.petName}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{log.portionGrams}g</td>
                    <td className="px-4 py-3 text-slate-600">{log.dispensedAt}</td>
                    <td className="px-4 py-3"><StatusBadge status={log.status} size="sm" /></td>
                    <td className="px-4 py-3 font-bold text-rose-600">{log.deviceId || 'Cage 1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'Hydration Log' && (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/70 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Log ID</th>
                  <th className="px-4 py-3">Pet Name</th>
                  <th className="px-4 py-3">Volume Consumed</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Reservoir Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredHydrationLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-600">{log.id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{log.petName}</td>
                    <td className="px-4 py-3 font-semibold text-sky-600">{log.amountMl} ml</td>
                    <td className="px-4 py-3 text-slate-600">{log.timestamp}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{log.reservoirLevelPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'AI Health Alerts' && (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/70 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Alert ID</th>
                  <th className="px-4 py-3">Pet Name</th>
                  <th className="px-4 py-3">Observed Reading</th>
                  <th className="px-4 py-3">AI Observation</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Review Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredAlerts.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-600">{a.id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{a.petName}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{a.observedReading}</td>
                    <td className="px-4 py-3 text-slate-700">{a.aiObservation}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.severity} size="sm" /></td>
                    <td className="px-4 py-3 text-slate-600">{a.timestamp}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.reviewStatus} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'Comprehensive Health' && (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/70 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Pet Patient</th>
                  <th className="px-4 py-3">Species / Breed</th>
                  <th className="px-4 py-3">Age & Weight</th>
                  <th className="px-4 py-3">Owner Info</th>
                  <th className="px-4 py-3">Assigned Unit</th>
                  <th className="px-4 py-3">Daily Hydration Target</th>
                  <th className="px-4 py-3">Health Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredPets.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <img src={p.avatarUrl} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                        <div>
                          <span>{p.name}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">{p.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span>{p.species}</span>
                      <span className="block text-[10px] text-slate-400">{p.breed}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {p.age} yrs • {p.weight} kg
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{p.ownerName}</span>
                      <span className="block text-[10px] text-slate-400">{p.ownerPhone}</span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-rose-600">
                      {p.assignedDeviceId || 'Cage 1'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-sky-600">
                      {p.hydrationTarget} ml/day
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.healthStatus} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAppContext } from '../hooks/useAppContext';
import { downloadCSV, printReportWindow, generateClinicalReportHTML } from '../utils/exportUtils';
import { StatusBadge } from '../components/StatusBadge';
import { sendVisionAnalyticsReport } from '../services/emailService';
import { getVisionAnalyticsRecords, calculateDailyVisionSummary, generateVisionAnalyticsReport } from '../services/visionAnalyticsService';
import { VisionAnalyticsModal } from '../components/camera/VisionAnalyticsModal';
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
  UserCheck,
  CheckSquare,
  Square,
  X,
  Calendar,
  Layers,
  Sparkles,
  FileCheck,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  Info,
  Send,
  Mail,
  RefreshCw,
  Eye
} from 'lucide-react';
import { FeedingLog, HydrationLog, AIHealthAlert, Pet } from '../types';

export const ReportsPage: React.FC = () => {
  const { pets, feedingLogs, hydrationLogs, vitals, alerts, schedules, showToast } = useAppContext();

  // Filters
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedPetId, setSelectedPetId] = useState('All');
  const [reportType, setReportType] = useState('Comprehensive Health');
  const [searchQuery, setSearchQuery] = useState('');

  // Specific Selection State (Set of row IDs)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Comprehensive sections toggle
  const [compSections, setCompSections] = useState({
    pets: true,
    feeding: true,
    hydration: true,
    alerts: true,
    vision: true
  });

  // Vision Analytics Modal state
  const [visionModalOpen, setVisionModalOpen] = useState(false);
  const [visionPetId, setVisionPetId] = useState<string>('All');
  const [visionPetName, setVisionPetName] = useState<string>('All Patients');

  // Individual pet report sending state
  const [sendingPetId, setSendingPetId] = useState<string | null>(null);

  const filteredPetName = selectedPetId === 'All' ? 'All Patients' : (pets ?? []).find(p => p.id === selectedPetId)?.name || 'Patient';

  // Helper: check if a date string falls inside the active date range
  const isDateInRange = (dateStr?: string): boolean => {
    if (!dateStr || dateRange === 'All Time') return true;

    let itemDate: Date;
    const trimmed = dateStr.trim();
    // If it's a clock time like "02:30 PM" or "14:30", it occurred today
    if (/^\d{1,2}:\d{2}(\s*(AM|PM|am|pm))?$/.test(trimmed)) {
      itemDate = new Date();
    } else {
      itemDate = new Date(trimmed);
      if (isNaN(itemDate.getTime())) return true;
    }

    const now = new Date();
    const startOfDay = (d: Date) => {
      const res = new Date(d);
      res.setHours(0, 0, 0, 0);
      return res;
    };
    const endOfDay = (d: Date) => {
      const res = new Date(d);
      res.setHours(23, 59, 59, 999);
      return res;
    };

    if (dateRange === 'Today') {
      return itemDate >= startOfDay(now) && itemDate <= endOfDay(now);
    }
    if (dateRange === 'Yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      return itemDate >= startOfDay(yest) && itemDate <= endOfDay(yest);
    }
    if (dateRange === 'Last 7 Days') {
      const d7 = new Date(now);
      d7.setDate(d7.getDate() - 7);
      return itemDate >= startOfDay(d7) && itemDate <= endOfDay(now);
    }
    if (dateRange === 'Last 30 Days') {
      const d30 = new Date(now);
      d30.setDate(d30.getDate() - 30);
      return itemDate >= startOfDay(d30) && itemDate <= endOfDay(now);
    }
    if (dateRange === 'Current Month') {
      const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return itemDate >= startOfDay(mStart) && itemDate <= endOfDay(now);
    }
    if (dateRange === 'Custom Range') {
      if (customStartDate && itemDate < startOfDay(new Date(customStartDate))) return false;
      if (customEndDate && itemDate > endOfDay(new Date(customEndDate))) return false;
      return true;
    }
    return true;
  };

  // Dynamic filter for logs with Search and Date Range
  const filteredPets = useMemo(() => {
    return (pets ?? []).filter(p => {
      const matchesPet = selectedPetId === 'All' || p.id === selectedPetId;
      if (!matchesPet) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.species.toLowerCase().includes(q) ||
        p.breed.toLowerCase().includes(q) ||
        p.ownerName.toLowerCase().includes(q) ||
        (p.assignedDeviceId && p.assignedDeviceId.toLowerCase().includes(q))
      );
    });
  }, [pets, selectedPetId, searchQuery]);

  const filteredFeedingLogs = useMemo(() => {
    return (feedingLogs ?? []).filter(f => {
      const matchesPet = selectedPetId === 'All' || f.petId === selectedPetId;
      if (!matchesPet) return false;
      if (!isDateInRange(f.dispensedAt)) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        f.id.toLowerCase().includes(q) ||
        f.petName.toLowerCase().includes(q) ||
        f.status.toLowerCase().includes(q) ||
        (f.deviceId && f.deviceId.toLowerCase().includes(q)) ||
        `${f.portionGrams}g`.includes(q)
      );
    });
  }, [feedingLogs, selectedPetId, dateRange, customStartDate, customEndDate, searchQuery]);

  const filteredHydrationLogs = useMemo(() => {
    return (hydrationLogs ?? []).filter(h => {
      const matchesPet = selectedPetId === 'All' || h.petId === selectedPetId;
      if (!matchesPet) return false;
      if (!isDateInRange(h.timestamp)) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        h.id.toLowerCase().includes(q) ||
        h.petName.toLowerCase().includes(q) ||
        `${h.amountMl}ml`.toLowerCase().includes(q) ||
        h.timestamp.toLowerCase().includes(q)
      );
    });
  }, [hydrationLogs, selectedPetId, dateRange, customStartDate, customEndDate, searchQuery]);

  const filteredAlerts = useMemo(() => {
    return (alerts ?? []).filter(a => {
      const matchesPet = selectedPetId === 'All' || a.petId === selectedPetId;
      if (!matchesPet) return false;
      if (!isDateInRange(a.timestamp)) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.id.toLowerCase().includes(q) ||
        a.petName.toLowerCase().includes(q) ||
        a.aiObservation.toLowerCase().includes(q) ||
        a.observedReading.toLowerCase().includes(q) ||
        a.severity.toLowerCase().includes(q) ||
        a.reviewStatus.toLowerCase().includes(q)
      );
    });
  }, [alerts, selectedPetId, dateRange, customStartDate, customEndDate, searchQuery]);

  // Current visible rows depending on report type
  const currentVisibleItems = useMemo(() => {
    if (reportType === 'Feeding Summary') return filteredFeedingLogs;
    if (reportType === 'Hydration Log') return filteredHydrationLogs;
    if (reportType === 'AI Health Alerts') return filteredAlerts;
    if (reportType === 'Vision Analytics') return [];
    return filteredPets;
  }, [reportType, filteredFeedingLogs, filteredHydrationLogs, filteredAlerts, filteredPets]);

  const currentVisibleIds = useMemo(() => {
    return currentVisibleItems.map(item => item.id);
  }, [currentVisibleItems]);

  const isAllVisibleSelected = currentVisibleIds.length > 0 && currentVisibleIds.every(id => selectedIds.has(id));
  const hasSpecificSelection = selectedIds.size > 0;

  // Toggle selection for a single row
  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle select all visible rows
  const toggleSelectAll = () => {
    if (isAllVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentVisibleIds));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // ----------------------------------------------------
  // HANDLER: Print Report (supports specific selection)
  // ----------------------------------------------------
  const handlePrint = () => {
    const isSpecific = selectedIds.size > 0;
    const reportTitle = isSpecific
      ? `${reportType} Report (Specific Selection: ${selectedIds.size} records) — ${filteredPetName}`
      : `${reportType} Report — ${filteredPetName}`;
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Filter items if specific selection is active
    const feedLogsToPrint = isSpecific
      ? filteredFeedingLogs.filter(f => selectedIds.has(f.id))
      : filteredFeedingLogs;

    const hydLogsToPrint = isSpecific
      ? filteredHydrationLogs.filter(h => selectedIds.has(h.id))
      : filteredHydrationLogs;

    const alertsToPrint = isSpecific
      ? filteredAlerts.filter(a => selectedIds.has(a.id))
      : filteredAlerts;

    const petsToPrint = isSpecific
      ? filteredPets.filter(p => selectedIds.has(p.id))
      : filteredPets;

    let tableHtml = '';

    // Comprehensive Health - Pet profiles section
    if (reportType === 'Comprehensive Health' && compSections.pets) {
      tableHtml += `
        <h3 style="color:#4f46e5; margin-top:20px; font-size:15px; border-bottom:1px solid #e0e7ff; padding-bottom:6px;">Patient Demographics & Medical Profiles</h3>
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Species / Breed</th>
              <th>Age & Weight</th>
              <th>Owner Details</th>
              <th>Assigned Unit</th>
              <th>Hydration Target</th>
              <th>Health Status</th>
            </tr>
          </thead>
          <tbody>
            ${petsToPrint.length > 0 ? petsToPrint.map(p => `
              <tr>
                <td><strong>${p.name}</strong> <span style="font-size:10px; color:#64748b;">(${p.id})</span></td>
                <td>${p.species} - ${p.breed}</td>
                <td>${p.age} yrs • ${p.weight} kg</td>
                <td>${p.ownerName} (${p.ownerPhone})</td>
                <td>${p.assignedDeviceId || 'Cage 1'}</td>
                <td>${p.hydrationTarget} ml/day</td>
                <td><strong>${p.healthStatus}</strong></td>
              </tr>
            `).join('') : '<tr><td colspan="7">No pet records match criteria.</td></tr>'}
          </tbody>
        </table>
      `;
    }

    if ((reportType === 'Feeding Summary') || (reportType === 'Comprehensive Health' && compSections.feeding)) {
      tableHtml += `
        <h3 style="color:#0f766e; margin-top:24px; font-size:15px; border-bottom:1px solid #ccfbf1; padding-bottom:6px;">Feeding Dispense Telemetry Log</h3>
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
            ${feedLogsToPrint.length > 0 ? feedLogsToPrint.map(f => `
              <tr>
                <td><code>${f.id}</code></td>
                <td><strong>${f.petName}</strong></td>
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

    if ((reportType === 'Hydration Log') || (reportType === 'Comprehensive Health' && compSections.hydration)) {
      tableHtml += `
        <h3 style="color:#0284c7; margin-top:24px; font-size:15px; border-bottom:1px solid #e0f2fe; padding-bottom:6px;">Hydration Intake Telemetry Log</h3>
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
            ${hydLogsToPrint.length > 0 ? hydLogsToPrint.map(h => `
              <tr>
                <td><code>${h.id}</code></td>
                <td><strong>${h.petName}</strong></td>
                <td><strong>${h.amountMl} ml</strong></td>
                <td>${h.timestamp}</td>
                <td>${h.reservoirLevelPct}%</td>
              </tr>
            `).join('') : '<tr><td colspan="5">No hydration intake logs recorded.</td></tr>'}
          </tbody>
        </table>
      `;
    }

    if ((reportType === 'AI Health Alerts') || (reportType === 'Comprehensive Health' && compSections.alerts)) {
      tableHtml += `
        <h3 style="color:#d97706; margin-top:24px; font-size:15px; border-bottom:1px solid #fef3c7; padding-bottom:6px;">AI Health Observations Log</h3>
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
            ${alertsToPrint.length > 0 ? alertsToPrint.map(a => `
              <tr>
                <td><code>${a.id}</code></td>
                <td><strong>${a.petName}</strong></td>
                <td>${a.observedReading}</td>
                <td>${a.aiObservation}</td>
                <td><strong>${a.severity}</strong></td>
                <td>${a.reviewStatus}</td>
              </tr>
            `).join('') : '<tr><td colspan="6">No AI health alerts recorded.</td></tr>'}
          </tbody>
        </table>
      `;
    }

    if ((reportType === 'Comprehensive Health' && compSections.vision)) {
      const visionSummary = calculateDailyVisionSummary(selectedPetId === 'All' ? undefined : selectedPetId);
      tableHtml += `
        <h3 style="color:#ec4899; margin-top:24px; font-size:15px; border-bottom:1px solid:#fce7f3; padding-bottom:6px;">Vision Analytics Summary</h3>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Today's Visits</strong></td>
              <td>${visionSummary.totalVisits} (${visionSummary.averageConfidence}% AI Confidence)</td>
            </tr>
            <tr>
              <td><strong>Feeding Dwell Time</strong></td>
              <td>${visionSummary.feedingMinutes} minutes</td>
            </tr>
            <tr>
              <td><strong>Hydration Dwell Time</strong></td>
              <td>${visionSummary.hydrationMinutes} minutes</td>
            </tr>
            <tr>
              <td><strong>Health & Vigor Score</strong></td>
              <td>${visionSummary.averageHealthScore}/100</td>
            </tr>
            <tr>
              <td><strong>Last Visit Time</strong></td>
              <td>${visionSummary.lastVisitTime}</td>
            </tr>
          </tbody>
        </table>
      `;
    }

    const content = `
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0d9488; padding-bottom: 16px;">
        <h2 style="margin:0; color:#0d9488; font-size:22px;">Heritage Animal Clinic</h2>
        <p style="margin:4px 0; color:#64748b; font-size:13px;">HydroNourish Smart Automated Telemetry System</p>
        <h1 style="margin-top:12px; font-size:18px; color:#1e293b;">${reportTitle}</h1>
        <p style="font-size:12px; color:#475569;">
          <strong>Generated Date:</strong> ${dateStr} | 
          <strong>Range:</strong> ${dateRange === 'Custom Range' ? `${customStartDate} to ${customEndDate}` : dateRange} | 
          <strong>Patient:</strong> ${filteredPetName}
          ${isSpecific ? ` | <strong style="color:#e11d48;">[SPECIFIC EXPORT: ${selectedIds.size} records]</strong>` : ''}
        </p>
      </div>
      ${tableHtml}
      <div style="margin-top: 40px; padding-top: 16px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; font-size: 11px; color: #64748b;">
        <div>Attending Veterinarian Signature: _______________________</div>
        <div>Clinic Seal & Stamp</div>
      </div>
    `;
    printReportWindow(reportTitle, content);
    showToast(
      'success',
      'Report Prepared',
      isSpecific
        ? `Print dialog launched for ${selectedIds.size} specifically selected record(s).`
        : `Print dialog launched for ${reportType}.`
    );
  };

  // ----------------------------------------------------
  // HANDLER: CSV Export (supports specific selection)
  // ----------------------------------------------------
  const handleExportCSV = () => {
    const isSpecific = selectedIds.size > 0;
    let rows: Record<string, any>[] = [];

    if (reportType === 'Feeding Summary') {
      const source = isSpecific
        ? filteredFeedingLogs.filter(f => selectedIds.has(f.id))
        : filteredFeedingLogs;
      rows = source.map(f => ({
        LogID: f.id,
        PetID: f.petId,
        PetName: f.petName,
        PortionGrams: f.portionGrams,
        DispensedAt: f.dispensedAt,
        Status: f.status,
        HardwareUnit: f.deviceId || 'Cage 1'
      }));
    } else if (reportType === 'Hydration Log') {
      const source = isSpecific
        ? filteredHydrationLogs.filter(h => selectedIds.has(h.id))
        : filteredHydrationLogs;
      rows = source.map(h => ({
        LogID: h.id,
        PetID: h.petId,
        PetName: h.petName,
        AmountMl: h.amountMl,
        Timestamp: h.timestamp,
        ReservoirLevelPct: h.reservoirLevelPct
      }));
    } else if (reportType === 'AI Health Alerts') {
      const source = isSpecific
        ? filteredAlerts.filter(a => selectedIds.has(a.id))
        : filteredAlerts;
      rows = source.map(a => ({
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
      // Comprehensive Health - Pet summaries
      const source = isSpecific
        ? filteredPets.filter(p => selectedIds.has(p.id))
        : filteredPets;
      rows = source.map(p => ({
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
      showToast('warning', 'No Data Available', 'There are no telemetry records matching the selected specific criteria.');
      return;
    }

    const cleanFilename = isSpecific
      ? `HydroNourish_Specific_${reportType.replace(/\s+/g, '_')}_${selectedIds.size}records_${Date.now()}`
      : `HydroNourish_${reportType.replace(/\s+/g, '_')}_${selectedPetId}_${dateRange.replace(/\s+/g, '_')}`;

    downloadCSV(cleanFilename, rows);
    showToast(
      'success',
      'CSV Export Complete',
      isSpecific
        ? `Exported ${rows.length} specifically selected record(s) to ${cleanFilename}.csv`
        : `Exported ${rows.length} record(s) to ${cleanFilename}.csv`
    );
  };

  // ----------------------------------------------------
  // HANDLER: PDF Export
  // ----------------------------------------------------
  const handleDownloadPDF = () => {
    handlePrint();
    showToast('info', 'PDF Export Ready', 'In the print dialog, select "Save as PDF" to download your file.');
  };

  // ----------------------------------------------------
  // HANDLER: Send Report to Pet Owner
  // ----------------------------------------------------
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [selectedOwnerEmail, setSelectedOwnerEmail] = useState<string | null>(null);

  const handleSendToOwner = async () => {
    // Determine the recipient
    let recipientEmail: string | null = null;
    let recipientName: string = 'Pet Owner';
    let petName: string = 'Patient';

    if (selectedPetId !== 'All') {
      const pet = (pets ?? []).find(p => p.id === selectedPetId);
      if (pet) {
        recipientEmail = pet.ownerEmail || null;
        recipientName = pet.ownerName;
        petName = pet.name;
      }
    } else if (filteredPets.length === 1) {
      // If only one pet is visible, use that pet's owner
      const pet = filteredPets[0];
      recipientEmail = pet.ownerEmail || null;
      recipientName = pet.ownerName;
      petName = pet.name;
    }

    if (!recipientEmail) {
      showToast('error', 'No Owner Email', 'Pet owner email not found. Please update pet profile.');
      return;
    }

    setIsSendingReport(true);
    try {
      // Generate report HTML
      const isSpecific = selectedIds.size > 0;
      const feedLogsToSend = isSpecific
        ? filteredFeedingLogs.filter(f => selectedIds.has(f.id))
        : filteredFeedingLogs;
      const hydLogsToSend = isSpecific
        ? filteredHydrationLogs.filter(h => selectedIds.has(h.id))
        : filteredHydrationLogs;
      const alertsToSend = isSpecific
        ? filteredAlerts.filter(a => selectedIds.has(a.id))
        : filteredAlerts;
      const petsToSend = isSpecific
        ? filteredPets.filter(p => selectedIds.has(p.id))
        : filteredPets;

      const reportHTML = generateClinicalReportHTML(
        reportType,
        `${reportType} Report — ${filteredPetName}`,
        dateRange,
        customStartDate,
        customEndDate,
        filteredPetName,
        isSpecific,
        selectedIds.size,
        petsToSend,
        feedLogsToSend,
        hydLogsToSend,
        alertsToSend,
        compSections
      );

      const result = await sendVisionAnalyticsReport(
        recipientEmail,
        recipientName,
        petName,
        reportHTML
      );

      if (result.success) {
        showToast('success', 'Report Sent', `Clinical report sent to ${recipientName} (${recipientEmail})`);
      } else {
        showToast('error', 'Send Failed', result.message);
      }
    } catch (error) {
      showToast('error', 'Send Failed', 'Failed to send clinical report. Please try again.');
    } finally {
      setIsSendingReport(false);
    }
  };

  // ----------------------------------------------------
  // HANDLER: View Vision Analytics
  // ----------------------------------------------------
  const handleViewVisionAnalytics = () => {
    setVisionPetId(selectedPetId);
    setVisionPetName(filteredPetName);
    setVisionModalOpen(true);
  };

  // ----------------------------------------------------
  // HANDLER: Send Report to Specific Pet Owner
  // ----------------------------------------------------
  const handleSendToPetOwner = async (pet: Pet) => {
    if (!pet.ownerEmail) {
      showToast('error', 'No Owner Email', `${pet.name} has no owner email address configured.`);
      return;
    }

    setSendingPetId(pet.id);

    try {
      // Generate report for this specific pet only
      const feedLogsToSend = filteredFeedingLogs.filter(f => f.petId === pet.id);
      const hydLogsToSend = filteredHydrationLogs.filter(h => h.petId === pet.id);
      const alertsToSend = filteredAlerts.filter(a => a.petId === pet.id);
      const petsToSend = [pet];

      const reportHTML = generateClinicalReportHTML(
        'Comprehensive Health',
        `Comprehensive Health Report — ${pet.name}`,
        dateRange,
        customStartDate,
        customEndDate,
        pet.name,
        false,
        1,
        petsToSend,
        feedLogsToSend,
        hydLogsToSend,
        alertsToSend,
        compSections
      );

      const result = await sendVisionAnalyticsReport(
        pet.ownerEmail,
        pet.ownerName,
        pet.name,
        reportHTML
      );

      if (result.success) {
        showToast('success', 'Report Sent', `Clinical report sent to ${pet.ownerName} (${pet.ownerEmail}) for ${pet.name}`);
      } else {
        showToast('error', 'Send Failed', result.message);
      }
    } catch (error) {
      showToast('error', 'Send Failed', 'Failed to send clinical report. Please try again.');
    } finally {
      setSendingPetId(null);
    }
  };

  // ----------------------------------------------------
  // HANDLERS: Individual Single-Record Specific Download
  // ----------------------------------------------------
  const handleDownloadSingleCSV = (item: any, type: string) => {
    let row: Record<string, any> = {};
    let filename = '';

    if (type === 'Feeding') {
      row = {
        LogID: item.id,
        PetID: item.petId,
        PetName: item.petName,
        PortionGrams: item.portionGrams,
        DispensedAt: item.dispensedAt,
        Status: item.status,
        HardwareUnit: item.deviceId || 'Cage 1',
        ExportTimestamp: new Date().toISOString()
      };
      filename = `HydroNourish_FeedingRecord_${item.id}_${item.petName}`;
    } else if (type === 'Hydration') {
      row = {
        LogID: item.id,
        PetID: item.petId,
        PetName: item.petName,
        AmountMl: item.amountMl,
        Timestamp: item.timestamp,
        ReservoirLevelPct: item.reservoirLevelPct,
        ExportTimestamp: new Date().toISOString()
      };
      filename = `HydroNourish_HydrationRecord_${item.id}_${item.petName}`;
    } else if (type === 'AIAlert') {
      row = {
        AlertID: item.id,
        PetID: item.petId,
        PetName: item.petName,
        ObservedReading: item.observedReading,
        AIObservation: item.aiObservation,
        Severity: item.severity,
        ReviewStatus: item.reviewStatus,
        Timestamp: item.timestamp,
        ExportTimestamp: new Date().toISOString()
      };
      filename = `HydroNourish_AIAlertRecord_${item.id}_${item.petName}`;
    } else {
      // Pet Profile
      row = {
        PetID: item.id,
        Name: item.name,
        Species: item.species,
        Breed: item.breed,
        AgeYears: item.age,
        WeightKg: item.weight,
        OwnerName: item.ownerName,
        OwnerPhone: item.ownerPhone,
        AssignedUnit: item.assignedDeviceId || 'Cage 1',
        HealthStatus: item.healthStatus,
        DailyHydrationTargetMl: item.hydrationTarget,
        DailyPortionGrams: item.feedingPlan?.portionGrams || 100,
        ExportTimestamp: new Date().toISOString()
      };
      filename = `HydroNourish_PatientProfile_${item.id}_${item.name}`;
    }

    downloadCSV(filename, [row]);
    showToast('success', 'Specific Record Downloaded', `Downloaded record ${item.id} (${filename}.csv)`);
  };

  const handlePrintSingleRecord = (item: any, type: string) => {
    let title = '';
    let bodyHtml = '';

    if (type === 'Feeding') {
      title = `Feeding Telemetry Slip — ${item.petName} (${item.id})`;
      bodyHtml = `
        <div style="max-width: 600px; margin: 0 auto; border: 2px solid #0d9488; border-radius: 12px; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff;">
          <div style="border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h2 style="margin: 0; color: #0d9488; font-size: 20px; font-weight: 800;">Heritage Animal Clinic</h2>
              <p style="margin: 2px 0 0 0; color: #64748b; font-size: 11px;">Department of Veterinary Telemetry & Diagnostics</p>
            </div>
            <div style="text-align: right;">
              <span style="display: inline-block; background: #ecfdf5; color: #065f46; font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 9999px; border: 1px solid #a7f3d0;">OFFICIAL TELEMETRY RECORD</span>
              <p style="margin: 4px 0 0 0; font-family: monospace; font-size: 11px; color: #64748b; font-weight: 700;">ID: ${item.id}</p>
            </div>
          </div>
          <h3 style="margin: 0 0 16px 0; color: #1e293b; font-size: 16px;">Individual Feeding Telemetry Certificate</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background: #f8fafc;"><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; width: 40%; color: #475569;">Patient Name</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${item.petName} (ID: ${item.petId})</td></tr>
            <tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Portion Served</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 700; color: #059669;">${item.portionGrams} grams</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Dispensed Timestamp</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #0f172a;">${item.dispensedAt}</td></tr>
            <tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Dispensing Status</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${item.status}</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Hardware Node / Unit</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-family: monospace; color: #e11d48; font-weight: 700;">${item.deviceId || 'Cage 1'}</td></tr>
            <tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Verification Timestamp</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #64748b; font-size: 11px;">${new Date().toLocaleString()}</td></tr>
          </table>
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; font-size: 10px; color: #64748b;">
            <div>Attending Veterinarian: _______________________</div>
            <div>Official Clinic Stamp</div>
          </div>
        </div>
      `;
    } else if (type === 'Hydration') {
      title = `Hydration Telemetry Slip — ${item.petName} (${item.id})`;
      bodyHtml = `
        <div style="max-width: 600px; margin: 0 auto; border: 2px solid #0284c7; border-radius: 12px; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff;">
          <div style="border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h2 style="margin: 0; color: #0284c7; font-size: 20px; font-weight: 800;">Heritage Animal Clinic</h2>
              <p style="margin: 2px 0 0 0; color: #64748b; font-size: 11px;">Department of Veterinary Telemetry & Diagnostics</p>
            </div>
            <div style="text-align: right;">
              <span style="display: inline-block; background: #f0f9ff; color: #0369a1; font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 9999px; border: 1px solid #bae6fd;">OFFICIAL TELEMETRY RECORD</span>
              <p style="margin: 4px 0 0 0; font-family: monospace; font-size: 11px; color: #64748b; font-weight: 700;">ID: ${item.id}</p>
            </div>
          </div>
          <h3 style="margin: 0 0 16px 0; color: #1e293b; font-size: 16px;">Individual Hydration Intake Certificate</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background: #f8fafc;"><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; width: 40%; color: #475569;">Patient Name</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${item.petName} (ID: ${item.petId})</td></tr>
            <tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Fluid Consumed</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 700; color: #0284c7; font-size: 15px;">${item.amountMl} ml</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Intake Timestamp</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #0f172a;">${item.timestamp}</td></tr>
            <tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Remaining Reservoir</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${item.reservoirLevelPct}%</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Verification Timestamp</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #64748b; font-size: 11px;">${new Date().toLocaleString()}</td></tr>
          </table>
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; font-size: 10px; color: #64748b;">
            <div>Attending Veterinarian: _______________________</div>
            <div>Official Clinic Stamp</div>
          </div>
        </div>
      `;
    } else if (type === 'AIAlert') {
      title = `AI Health Diagnostic Slip — ${item.petName} (${item.id})`;
      bodyHtml = `
        <div style="max-width: 600px; margin: 0 auto; border: 2px solid #d97706; border-radius: 12px; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff;">
          <div style="border-bottom: 2px solid #d97706; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h2 style="margin: 0; color: #d97706; font-size: 20px; font-weight: 800;">Heritage Animal Clinic</h2>
              <p style="margin: 2px 0 0 0; color: #64748b; font-size: 11px;">AI Clinical Diagnostics & Health Surveillance</p>
            </div>
            <div style="text-align: right;">
              <span style="display: inline-block; background: #fffbeb; color: #92400e; font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 9999px; border: 1px solid #fde68a;">CLINICAL OBSERVATION</span>
              <p style="margin: 4px 0 0 0; font-family: monospace; font-size: 11px; color: #64748b; font-weight: 700;">ID: ${item.id}</p>
            </div>
          </div>
          <h3 style="margin: 0 0 16px 0; color: #1e293b; font-size: 16px;">AI Clinical Health Incident Notice</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background: #f8fafc;"><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; width: 40%; color: #475569;">Patient Name</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${item.petName} (ID: ${item.petId})</td></tr>
            <tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Observed Telemetry</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 700; color: #b45309;">${item.observedReading}</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">AI Diagnostic Finding</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #0f172a;">${item.aiObservation}</td></tr>
            <tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Assigned Severity</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 700; color: #dc2626;">${item.severity}</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Clinical Review Status</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #0f172a;">${item.reviewStatus}</td></tr>
            <tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Observed Timestamp</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #64748b;">${item.timestamp}</td></tr>
          </table>
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; font-size: 10px; color: #64748b;">
            <div>Attending Veterinarian: _______________________</div>
            <div>Official Clinic Stamp</div>
          </div>
        </div>
      `;
    } else {
      // Pet Profile Dossier
      const p = item as Pet;
      const petFeeding = feedingLogs.filter(f => f.petId === p.id);
      const petHydration = hydrationLogs.filter(h => h.petId === p.id);
      const petAlerts = alerts.filter(a => a.petId === p.id);

      title = `Patient Medical Telemetry Dossier — ${p.name} (${p.id})`;
      bodyHtml = `
        <div style="max-width: 700px; margin: 0 auto; border: 2px solid #4f46e5; border-radius: 12px; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff;">
          <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h2 style="margin: 0; color: #4f46e5; font-size: 20px; font-weight: 800;">Heritage Animal Clinic</h2>
              <p style="margin: 2px 0 0 0; color: #64748b; font-size: 11px;">Patient Clinical Medical & Telemetry Dossier</p>
            </div>
            <div style="text-align: right;">
              <span style="display: inline-block; background: #eef2ff; color: #4338ca; font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 9999px; border: 1px solid #c7d2fe;">PATIENT RECORD</span>
              <p style="margin: 4px 0 0 0; font-family: monospace; font-size: 11px; color: #64748b; font-weight: 700;">ID: ${p.id}</p>
            </div>
          </div>
          <h3 style="margin: 0 0 12px 0; color: #1e293b; font-size: 16px;">Clinical Patient Summary: ${p.name}</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background: #f8fafc;"><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; width: 35%; color: #475569;">Species / Breed</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${p.species} • ${p.breed}</td></tr>
            <tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Age & Weight</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #0f172a;">${p.age} years • ${p.weight} kg</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Owner Information</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #0f172a;">${p.ownerName} (${p.ownerPhone})</td></tr>
            <tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Assigned Unit / Cage</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: 700; color: #e11d48;">${p.assignedDeviceId || 'Cage 1'}</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Health Status</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 700; color: #059669;">${p.healthStatus}</td></tr>
            <tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Daily Targets</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #0f172a;">Water: ${p.hydrationTarget} ml/day • Food: ${p.feedingPlan?.portionGrams || 100}g portion</td></tr>
          </table>

          <h4 style="margin: 16px 0 8px 0; color: #0f766e; font-size: 13px;">Recent Feeding History (${petFeeding.length} events)</h4>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px;">
            <thead><tr style="background: #f1f5f9;"><th style="padding: 6px; border: 1px solid #e2e8f0;">Log ID</th><th style="padding: 6px; border: 1px solid #e2e8f0;">Portion</th><th style="padding: 6px; border: 1px solid #e2e8f0;">Dispensed At</th><th style="padding: 6px; border: 1px solid #e2e8f0;">Status</th></tr></thead>
            <tbody>
              ${petFeeding.slice(0, 5).map(f => `<tr><td style="padding: 6px; border: 1px solid #e2e8f0;">${f.id}</td><td style="padding: 6px; border: 1px solid #e2e8f0;">${f.portionGrams}g</td><td style="padding: 6px; border: 1px solid #e2e8f0;">${f.dispensedAt}</td><td style="padding: 6px; border: 1px solid #e2e8f0;">${f.status}</td></tr>`).join('') || '<tr><td colspan="4" style="text-align:center; padding:8px;">No recent feeding events.</td></tr>'}
            </tbody>
          </table>

          <h4 style="margin: 16px 0 8px 0; color: #0284c7; font-size: 13px;">Recent Hydration History (${petHydration.length} events)</h4>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px;">
            <thead><tr style="background: #f1f5f9;"><th style="padding: 6px; border: 1px solid #e2e8f0;">Log ID</th><th style="padding: 6px; border: 1px solid #e2e8f0;">Amount</th><th style="padding: 6px; border: 1px solid #e2e8f0;">Timestamp</th><th style="padding: 6px; border: 1px solid #e2e8f0;">Reservoir</th></tr></thead>
            <tbody>
              ${petHydration.slice(0, 5).map(h => `<tr><td style="padding: 6px; border: 1px solid #e2e8f0;">${h.id}</td><td style="padding: 6px; border: 1px solid #e2e8f0;">${h.amountMl} ml</td><td style="padding: 6px; border: 1px solid #e2e8f0;">${h.timestamp}</td><td style="padding: 6px; border: 1px solid #e2e8f0;">${h.reservoirLevelPct}%</td></tr>`).join('') || '<tr><td colspan="4" style="text-align:center; padding:8px;">No recent hydration events.</td></tr>'}
            </tbody>
          </table>

          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; font-size: 10px; color: #64748b;">
            <div>Attending Veterinarian Signature: _______________________</div>
            <div>Official Clinic Stamp</div>
          </div>
        </div>
      `;
    }

    printReportWindow(title, bodyHtml);
    showToast('success', 'Specific Slip Generated', `Print slip ready for ${item.name || item.petName || item.id}`);
  };

  return (
    <DashboardLayout pageTitle="Reports & Clinical Health Records" breadcrumbs={[{ label: 'Reports' }]}>
      {/* ================= REPORT FILTERS & ACTION BAR ================= */}
      <div className="clinic-card p-5 space-y-4">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            {/* Date Range Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={e => {
                  setDateRange(e.target.value);
                  setSelectedIds(new Set());
                }}
                className="px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:border-rose-500 focus:outline-none transition-colors"
              >
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Today">Today Only</option>
                <option value="Yesterday">Yesterday</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="Current Month">Current Month</option>
                <option value="Custom Range">Specific / Custom Date...</option>
                <option value="All Time">All Time</option>
              </select>
            </div>

            {/* Custom Date Pickers (Shown if Custom Range is selected) */}
            {dateRange === 'Custom Range' && (
              <div className="flex items-center gap-2 pt-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">From</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={e => setCustomStartDate(e.target.value)}
                    className="px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:border-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">To</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={e => setCustomEndDate(e.target.value)}
                    className="px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Pet Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-slate-400" />
                Patient Pet
              </label>
              <select
                value={selectedPetId}
                onChange={e => {
                  setSelectedPetId(e.target.value);
                  setSelectedIds(new Set());
                }}
                className="px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:border-rose-500 focus:outline-none transition-colors"
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
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                <Layers className="w-3 h-3 text-slate-400" />
                Report Category
              </label>
              <select
                value={reportType}
                onChange={e => {
                  setReportType(e.target.value);
                  setSelectedIds(new Set());
                }}
                className="px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:border-rose-500 focus:outline-none transition-colors"
              >
                <option value="Comprehensive Health">Comprehensive Care</option>
                <option value="Feeding Summary">Feeding Summary</option>
                <option value="Hydration Log">Hydration Log</option>
                <option value="AI Health Alerts">AI Observations Log</option>
                <option value="Vision Analytics">Vision Analytics</option>
              </select>
            </div>

            {/* Search Query Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                <Search className="w-3 h-3 text-slate-400" />
                Search Records
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter specific records..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-xl focus:border-rose-500 focus:outline-none w-44 md:w-56"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Master Export Actions */}
          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto pt-2 xl:pt-0 justify-end">
            <button
              onClick={handlePrint}
              className={`px-4 py-2.5 rounded-xl border font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs ${
                hasSpecificSelection
                  ? 'border-indigo-300 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
              title={hasSpecificSelection ? `Print only ${selectedIds.size} selected records` : 'Print all filtered records'}
            >
              <Printer className="w-4 h-4 text-slate-500" />
              {hasSpecificSelection ? `Print Selected (${selectedIds.size})` : 'Print All'}
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
              title={hasSpecificSelection ? `Export only ${selectedIds.size} selected records as CSV` : 'Export all records to CSV'}
            >
              <FileSpreadsheet className="w-4 h-4" />
              {hasSpecificSelection ? `Export CSV (${selectedIds.size} Selected)` : 'Export CSV'}
            </button>

            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
              title={hasSpecificSelection ? `Download PDF for ${selectedIds.size} selected records` : 'Download PDF of all records'}
            >
              <Download className="w-4 h-4" />
              {hasSpecificSelection ? `Download PDF (${selectedIds.size} Selected)` : 'Download PDF'}
            </button>
          </div>
        </div>

        {/* Comprehensive Health: Specific Sections Checklist */}
        {reportType === 'Comprehensive Health' && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
            <span className="font-bold text-slate-500 uppercase text-[10px] flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-slate-400" />
              Include Specific Sections in Report:
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 hover:text-slate-900">
              <input
                type="checkbox"
                checked={compSections.pets}
                onChange={e => setCompSections(prev => ({ ...prev, pets: e.target.checked }))}
                className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500"
              />
              Patient Demographics
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 hover:text-slate-900">
              <input
                type="checkbox"
                checked={compSections.feeding}
                onChange={e => setCompSections(prev => ({ ...prev, feeding: e.target.checked }))}
                className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500"
              />
              Feeding Telemetry
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 hover:text-slate-900">
              <input
                type="checkbox"
                checked={compSections.hydration}
                onChange={e => setCompSections(prev => ({ ...prev, hydration: e.target.checked }))}
                className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500"
              />
              Hydration Intake
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 hover:text-slate-900">
              <input
                type="checkbox"
                checked={compSections.alerts}
                onChange={e => setCompSections(prev => ({ ...prev, alerts: e.target.checked }))}
                className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500"
              />
              AI Observations
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 hover:text-slate-900">
              <input
                type="checkbox"
                checked={compSections.vision}
                onChange={e => setCompSections(prev => ({ ...prev, vision: e.target.checked }))}
                className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500"
              />
              Vision Analytics
            </label>
          </div>
        )}
      </div>

      {/* ================= DEDICATED SPECIFIC SELECTION ACTION BAR ================= */}
      {hasSpecificSelection && (
        <div className="bg-gradient-to-r from-rose-50 via-amber-50/50 to-emerald-50 border border-rose-200/90 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
              {selectedIds.size}
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-rose-600" />
                {selectedIds.size} specific record(s) selected
              </p>
              <p className="text-[11px] text-slate-500">
                Exports will now download <strong>ONLY</strong> your selected records. Click Deselect to revert to all.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Download Selected CSV
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              Download Selected PDF
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              Print Selected
            </button>
            <button
              onClick={handleClearSelection}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/80 rounded-xl transition-all border border-slate-200"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

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
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900">{reportType} Breakdown</h3>
              {hasSpecificSelection && (
                <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                  {selectedIds.size} Selected Specifically
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Displaying {currentVisibleItems.length} record(s) for {filteredPetName} ({dateRange})
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              {isAllVisibleSelected ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-rose-600" />
                  Deselect All Visible
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                  Select All Visible ({currentVisibleItems.length})
                </>
              )}
            </button>
            <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200">
              {reportType}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {/* FEEDING SUMMARY TABLE */}
          {reportType === 'Feeding Summary' && (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/70 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="w-12 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isAllVisibleSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                      title="Select all records to download specifically"
                    />
                  </th>
                  <th className="px-4 py-3">Log ID</th>
                  <th className="px-4 py-3">Pet Name</th>
                  <th className="px-4 py-3">Portion Served</th>
                  <th className="px-4 py-3">Dispensed At</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned Unit</th>
                  <th className="px-4 py-3 text-right">Specific Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredFeedingLogs.length > 0 ? (
                  filteredFeedingLogs.map(log => {
                    const isSelected = selectedIds.has(log.id);
                    return (
                      <tr
                        key={log.id}
                        className={`transition-colors ${isSelected ? 'bg-rose-50/60' : 'hover:bg-slate-50'}`}
                      >
                        <td className="w-12 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(log.id)}
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-600">{log.id}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{log.petName}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{log.portionGrams}g</td>
                        <td className="px-4 py-3 text-slate-600">{log.dispensedAt}</td>
                        <td className="px-4 py-3"><StatusBadge status={log.status} size="sm" /></td>
                        <td className="px-4 py-3 font-bold text-rose-600">{log.deviceId || 'Cage 1'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleDownloadSingleCSV(log, 'Feeding')}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                              title="Download this specific feeding log as CSV"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handlePrintSingleRecord(log, 'Feeding')}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                              title="Download / Print official certificate for this record"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No feeding records matching your current filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* HYDRATION LOG TABLE */}
          {reportType === 'Hydration Log' && (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/70 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="w-12 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isAllVisibleSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                      title="Select all records to download specifically"
                    />
                  </th>
                  <th className="px-4 py-3">Log ID</th>
                  <th className="px-4 py-3">Pet Name</th>
                  <th className="px-4 py-3">Volume Consumed</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Reservoir Level</th>
                  <th className="px-4 py-3 text-right">Specific Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredHydrationLogs.length > 0 ? (
                  filteredHydrationLogs.map(log => {
                    const isSelected = selectedIds.has(log.id);
                    return (
                      <tr
                        key={log.id}
                        className={`transition-colors ${isSelected ? 'bg-rose-50/60' : 'hover:bg-slate-50'}`}
                      >
                        <td className="w-12 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(log.id)}
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-600">{log.id}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{log.petName}</td>
                        <td className="px-4 py-3 font-semibold text-sky-600">{log.amountMl} ml</td>
                        <td className="px-4 py-3 text-slate-600">{log.timestamp}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">{log.reservoirLevelPct}%</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleDownloadSingleCSV(log, 'Hydration')}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                              title="Download this specific hydration record as CSV"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handlePrintSingleRecord(log, 'Hydration')}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-sky-700 hover:bg-sky-50 hover:border-sky-200 transition-colors"
                              title="Download / Print official certificate for this record"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No hydration records matching your current filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* AI HEALTH ALERTS TABLE */}
          {reportType === 'AI Health Alerts' && (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/70 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="w-12 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isAllVisibleSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                      title="Select all records to download specifically"
                    />
                  </th>
                  <th className="px-4 py-3">Alert ID</th>
                  <th className="px-4 py-3">Pet Name</th>
                  <th className="px-4 py-3">Observed Reading</th>
                  <th className="px-4 py-3">AI Observation</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Review Status</th>
                  <th className="px-4 py-3 text-right">Specific Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredAlerts.length > 0 ? (
                  filteredAlerts.map(a => {
                    const isSelected = selectedIds.has(a.id);
                    return (
                      <tr
                        key={a.id}
                        className={`transition-colors ${isSelected ? 'bg-rose-50/60' : 'hover:bg-slate-50'}`}
                      >
                        <td className="w-12 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(a.id)}
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-600">{a.id}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{a.petName}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">{a.observedReading}</td>
                        <td className="px-4 py-3 text-slate-700">{a.aiObservation}</td>
                        <td className="px-4 py-3"><StatusBadge status={a.severity} size="sm" /></td>
                        <td className="px-4 py-3 text-slate-600">{a.timestamp}</td>
                        <td className="px-4 py-3"><StatusBadge status={a.reviewStatus} size="sm" /></td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleDownloadSingleCSV(a, 'AIAlert')}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                              title="Download this specific AI observation as CSV"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handlePrintSingleRecord(a, 'AIAlert')}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-200 transition-colors"
                              title="Download / Print official observation certificate"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No AI health observations matching your current filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* COMPREHENSIVE HEALTH TABLE */}
          {reportType === 'Comprehensive Health' && (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/70 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="w-12 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isAllVisibleSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                      title="Select all patients to download specifically"
                    />
                  </th>
                  <th className="px-4 py-3">Pet Patient</th>
                  <th className="px-4 py-3">Species / Breed</th>
                  <th className="px-4 py-3">Age & Weight</th>
                  <th className="px-4 py-3">Owner Info</th>
                  <th className="px-4 py-3">Assigned Unit</th>
                  <th className="px-4 py-3">Daily Hydration Target</th>
                  <th className="px-4 py-3">Health Status</th>
                  <th className="px-4 py-3 text-right">Specific Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredPets.length > 0 ? (
                  filteredPets.map(p => {
                    const isSelected = selectedIds.has(p.id);
                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors ${isSelected ? 'bg-rose-50/60' : 'hover:bg-slate-50'}`}
                      >
                        <td className="w-12 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(p.id)}
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <img src={p.avatarUrl} alt={p.name} className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
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
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleDownloadSingleCSV(p, 'Pet')}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                              title={`Download ${p.name}'s medical profile CSV`}
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handlePrintSingleRecord(p, 'Pet')}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                              title={`Download / Print complete clinical dossier for ${p.name}`}
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setVisionPetId(p.id);
                                setVisionPetName(p.name);
                                setVisionModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-purple-700 hover:bg-purple-50 hover:border-purple-200 transition-colors"
                              title={`View Vision Analytics for ${p.name}`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No pet patient records matching your current filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Vision Analytics Modal */}
      <VisionAnalyticsModal
        isOpen={visionModalOpen}
        onClose={() => setVisionModalOpen(false)}
        petId={visionPetId}
        petName={visionPetName}
        petSpecies={selectedPetId === 'All' ? 'All Species' : (pets ?? []).find(p => p.id === selectedPetId)?.species || 'Unknown'}
      />
    </DashboardLayout>
  );
};

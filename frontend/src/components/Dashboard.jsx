import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Activity, FileText, Info, HelpCircle, User,
  LogOut, Zap, TrendingUp, TrendingDown, Minus,
  ChevronDown, ChevronUp, Copy, Check, Search,
  FlaskConical, ShieldCheck, AlertTriangle, Bell,
  Pill, Heart, Droplets, Shield, Cpu, ClipboardList,
  CheckCircle2, Plus, Trash2, ArrowRight, Sparkles,
  RefreshCw, Stethoscope, AlertCircle, Clock,
  ExternalLink, Layers, Database, Lock, X
} from 'lucide-react';
import { parseReport, parseReportFile } from '../services/api';
import { removeToken, getToken } from '../services/auth';
import { useNavigate } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────────────────────
// Sample Lab Reports (One Safe, One Flagged for Live Testing)
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_USER_ID = 'user_demo_001';

const SAMPLE_NORMAL_REPORT = `METROPOLITAN CLINICAL DIAGNOSTICS LABORATORY
Patient: Satvik Naga Surya | MRN: MPX-90412 | Date: 2024-05-18

COMPLETE BLOOD COUNT (CBC):
White Blood Cells (WBC):    5.20 K/µL   [Reference: 4.00 - 11.00]   NORMAL
Red Blood Cells (RBC):      4.35 M/µL   [Reference: 4.20 - 5.40]    NORMAL
Hemoglobin (Hgb):           13.8 g/dL   [Reference: 13.5 - 17.5]    NORMAL
Hematocrit (Hct):           41.2 %      [Reference: 41.0 - 53.0]    NORMAL
Platelets:                  220  K/µL   [Reference: 150 - 400]      NORMAL

COMPREHENSIVE METABOLIC PANEL (CMP):
Serum Creatinine:           1.02 mg/dL  [Reference: 0.70 - 1.20]    NORMAL
eGFR (CKD-EPI):             84   mL/min [Reference: > 60]           NORMAL
Potassium (K+):             4.2  mEq/L  [Reference: 3.5 - 5.1]      NORMAL
Sodium (Na+):               139  mEq/L  [Reference: 136 - 145]      NORMAL
Fasting Glucose:            96   mg/dL  [Reference: 70 - 99]        NORMAL

Active Prescriptions: Metformin 500mg BID, Lisinopril 10mg QD`;

const SAMPLE_CONTRAINDICATION_REPORT = `ACUTE CARE HEALTH SYSTEM - CRITICAL LAB REPORT
Patient: Satvik Naga Surya | MRN: MPX-90412 | Date: 2024-05-22

COMPLETE BLOOD COUNT (CBC):
White Blood Cells (WBC):    8.40 K/µL   [Reference: 4.00 - 11.00]   NORMAL
Red Blood Cells (RBC):      3.95 M/µL   [Reference: 4.20 - 5.40]    LOW
Hemoglobin (Hgb):           11.4 g/dL   [Reference: 13.5 - 17.5]    LOW

RENAL & METABOLIC PANEL:
Potassium (Serum K+):       5.9  mEq/L  [Reference: 3.5 - 5.1]      CRITICAL HIGH
Serum Creatinine:           2.45 mg/dL  [Reference: 0.70 - 1.20]    CRITICAL HIGH
Blood Urea Nitrogen (BUN):  38   mg/dL  [Reference: 7 - 20]         HIGH
eGFR (Renal Function):      24   mL/min [Reference: > 60]           SEVERE DECREASE

Current Prescribed Medications:
1. Lisinopril 10mg Once Daily (ACE Inhibitor)
2. Metformin 500mg Twice Daily (Biguanide)`;

// Initial Longitudinal Trajectory Data
const INITIAL_LONGITUDINAL_DATA = [
  { date: 'Dec 23', wbc: 4.6, rbc: 4.20, hgb: 13.2, platelets: 205 },
  { date: 'Feb 24', wbc: 5.1, rbc: 4.45, hgb: 13.7, platelets: 215 },
  { date: 'Apr 24', wbc: 4.9, rbc: 4.30, hgb: 13.5, platelets: 210 },
  { date: 'Jun 24', wbc: 5.8, rbc: 4.15, hgb: 13.0, platelets: 198 },
  { date: 'Aug 24', wbc: 5.4, rbc: 4.38, hgb: 13.6, platelets: 218 },
  { date: 'Oct 24', wbc: 5.2, rbc: 4.35, hgb: 13.8, platelets: 220 },
];

const INITIAL_REPORTS = [
  {
    id: 'RPT-2024-006',
    date: '2024-05-18',
    lab: 'Metropolitan Diagnostics',
    panel: 'CBC + CMP Full Profile',
    summary: 'WBC 5.2 K/µL, RBC 4.35 M/µL, Hgb 13.8 g/dL, K+ 4.2 mEq/L, eGFR 84 mL/min',
    status: 'Safe',
    safetyFlag: 'No Contraindications',
    biomarkersCount: 14,
    trend: 'Optimal'
  },
  {
    id: 'RPT-2024-005',
    date: '2024-02-14',
    lab: 'Apex Health Pathology',
    panel: 'CBC Differential Panel',
    summary: 'WBC 5.4 K/µL, RBC 4.38 M/µL, Hgb 13.6 g/dL, Platelets 218 K/µL',
    status: 'Safe',
    safetyFlag: 'No Contraindications',
    biomarkersCount: 8,
    trend: 'Stable'
  },
  {
    id: 'RPT-2023-018',
    date: '2023-11-09',
    lab: 'CarePoint Clinical Labs',
    panel: 'Renal & Electrolyte Screen',
    summary: 'K+ 5.4 mEq/L (BORDERLINE ELEVATED), Creatinine 1.35 mg/dL, eGFR 58 mL/min',
    status: 'Flagged',
    safetyFlag: 'Review Flag: Mild ACE-I Alert',
    biomarkersCount: 9,
    trend: 'Borderline'
  },
  {
    id: 'RPT-2023-012',
    date: '2023-08-02',
    lab: 'CityMed Central Diagnostic',
    panel: 'CBC Routine Screen',
    summary: 'WBC 4.9 K/µL, RBC 4.30 M/µL, Hgb 13.5 g/dL, Platelets 210 K/µL',
    status: 'Safe',
    safetyFlag: 'No Contraindications',
    biomarkersCount: 7,
    trend: 'Stable'
  },
];

const INITIAL_PRESCRIPTIONS = [
  {
    id: 'rx-1',
    name: 'Metformin',
    dosage: '500 mg',
    frequency: 'Twice Daily (BID)',
    category: 'Biguanide Antidiabetic',
    monitoredBiomarkers: ['eGFR', 'Serum Creatinine', 'Lactic Acid', 'HbA1c'],
    contraindicationWarning: 'Absolute contraindication if eGFR < 30 mL/min (Risk of fatal lactic acidosis).',
    active: true
  },
  {
    id: 'rx-2',
    name: 'Lisinopril',
    dosage: '10 mg',
    frequency: 'Once Daily (QD)',
    category: 'ACE Inhibitor (Antihypertensive)',
    monitoredBiomarkers: ['Potassium (K+)', 'Serum Creatinine', 'BUN', 'Blood Pressure'],
    contraindicationWarning: 'Flag immediately if Potassium (K+) > 5.2 mEq/L (Risk of life-threatening hyperkalemia).',
    active: true
  }
];

const FAQS = [
  {
    q: 'How does the Gemini AI Clinical Engine parse raw medical reports?',
    a: 'MedPulse-X utilizes multimodal Google Gemini models equipped with engineered clinical instruction prompts. It automatically detects, extracts, and normalizes biomarker names, measured numeric values, measurement units (e.g., K/µL, g/dL, mEq/L), and laboratory reference ranges from free-form text or uploaded laboratory documents without requiring rigid templates.'
  },
  {
    q: 'What is longitudinal health profiling, and why are single snapshots inadequate?',
    a: 'Standard diagnostic reviews evaluate a single report against broad population-level reference intervals. However, a biomarker (such as Serum Creatinine rising from 0.75 mg/dL to 1.15 mg/dL) may remain technically "within normal range" while exhibiting a 53% surge. Longitudinal profiling plots temporal trajectories, calculating rate-of-change velocities to catch subclinical chronic disease progression months before acute manifestation.'
  },
  {
    q: 'How does the Pharmacological Safety Gate prevent drug-lab contraindications?',
    a: 'Upon extraction of lab values, the Safety Gate cross-references active patient medications against physiological parameters. For example, if a patient is prescribed an ACE Inhibitor (Lisinopril) and their potassium exceeds 5.5 mEq/L, or is on Metformin with eGFR falling below 30 mL/min, the LLM flags the contraindication with clear pharmacological reasoning.'
  },
  {
    q: 'What medical file formats and diagnostic panels are supported?',
    a: 'MedPulse-X supports direct plain-text entry, digitized PDF reports via server-side parsing (pdf-parse), and high-resolution photo/scan uploads (JPEG, PNG, WEBP) parsed through Gemini Vision API. Supported panels include CBC, CMP, Lipid Panels, Renal Function, Liver Function, and Thyroid panels.'
  },
  {
    q: 'How is patient medical data protected and authenticated?',
    a: 'All application endpoints are guarded by JSON Web Token (JWT) cryptographic signatures, salted password hashing via bcryptjs (work factor 10), and strict per-user document isolation in MongoDB Atlas. Transport-level encryption (TLS/HTTPS) ensures zero unencrypted transit of clinical parameters.'
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// Shared Animation & Style Helpers
// ─────────────────────────────────────────────────────────────────────────────

const pageTransition = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.18 } }
};

const staggerChildren = {
  animate: { transition: { staggerChildren: 0.07 } }
};

const cardMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
};

const CustomChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl px-4 py-3 shadow-2xl text-xs text-white min-w-[170px]">
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-700">
        <span className="font-semibold text-slate-300">{label}</span>
        <span className="text-[10px] text-sky-400 font-mono">Longitudinal Sample</span>
      </div>
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-300 font-medium">{entry.name}:</span>
            </div>
            <span className="font-bold font-mono text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// VIEW 1: Home Dashboard (Main Workspace)
// ─────────────────────────────────────────────────────────────────────────────

const HomeView = ({ prescriptions, onSwitchTab }) => {
  const [inputMode, setInputMode] = useState('text'); // 'text' | 'file'
  const [reportText, setReportText] = useState(SAMPLE_NORMAL_REPORT);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [biomarkers, setBiomarkers] = useState(null);
  const [safetyAnalysis, setSafetyAnalysis] = useState(null);
  const fileInputRef = useRef(null);

  // Recharts Biomarker Visibility Filters
  const [activeLines, setActiveLines] = useState({
    wbc: true,
    rbc: true,
    hgb: true,
    platelets: false
  });

  const toggleLine = (key) => {
    setActiveLines(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setBiomarkers(null);
    setSafetyAnalysis(null);

    try {
      let data;
      if (inputMode === 'file' && selectedFile) {
        data = await parseReportFile(DEMO_USER_ID, selectedFile);
      } else {
        if (!reportText.trim()) {
          throw new Error('Please enter lab report text or choose a sample.');
        }
        data = await parseReport(DEMO_USER_ID, reportText);
      }

      setBiomarkers(data.biomarkers ?? null);
      setSafetyAnalysis(data.safetyAnalysis ?? null);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err.message ||
        'Error connecting to medical analysis service.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const biomarkerList = useMemo(() => {
    if (!biomarkers) return [];
    if (Array.isArray(biomarkers)) return biomarkers;
    return Object.entries(biomarkers).map(([label, raw]) => {
      if (typeof raw === 'object' && raw !== null) {
        return { label, value: raw.value ?? JSON.stringify(raw), status: raw.status };
      }
      return { label, value: String(raw), status: 'default' };
    });
  }, [biomarkers]);

  // Check if safety analysis mentions contraindications or high risks
  const hasSafetyFlag = useMemo(() => {
    if (!safetyAnalysis) return false;
    const lower = safetyAnalysis.toLowerCase();
    return lower.includes('contraindicat') || lower.includes('hyperkalemia') || lower.includes('severe') || lower.includes('risk') || lower.includes('warning');
  }, [safetyAnalysis]);

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">

      {/* ── Enterprise Hero Banner ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-16 w-64 h-64 rounded-full bg-blue-600/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Gemini 1.5 Flash AI Engine Active
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                <ShieldCheck size={12} className="text-sky-400" />
                Dual-Module Architecture
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Clinical Decision Support &amp; Longitudinal Profiling
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Synthesizing unstructured electronic diagnostic reports into dynamic time-series biomarker trajectories,
              while actively validating prescribed drug regimens against clinical lab thresholds.
            </p>
          </div>

          {/* Quick Stat Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 min-w-[260px]">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center">
              <p className="text-xs text-slate-400 font-medium">Logged Reports</p>
              <p className="text-xl font-bold text-white mt-0.5">6 Records</p>
              <span className="text-[10px] text-emerald-400 font-medium">18-Month Trajectory</span>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center">
              <p className="text-xs text-slate-400 font-medium">Safety Status</p>
              <p className="text-xl font-bold text-emerald-400 mt-0.5">Verified Safe</p>
              <span className="text-[10px] text-slate-400">0 Active Alerts</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 KPI Stat Cards ──────────────────────────────────────────────── */}
      <motion.div variants={staggerChildren} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'WBC Count',
            value: '5.20',
            unit: 'K/µL',
            normalRange: 'Ref: 4.00 – 11.00',
            status: 'Optimal',
            statusType: 'emerald',
            trend: '−4.2% vs previous',
            trendType: 'down',
            icon: Droplets,
            color: 'sky'
          },
          {
            title: 'RBC Count',
            value: '4.35',
            unit: 'M/µL',
            normalRange: 'Ref: 4.20 – 5.40',
            status: 'Stable',
            statusType: 'blue',
            trend: '+1.8% vs baseline',
            trendType: 'up',
            icon: Heart,
            color: 'rose'
          },
          {
            title: 'Hemoglobin (Hgb)',
            value: '13.8',
            unit: 'g/dL',
            normalRange: 'Ref: 13.5 – 17.5',
            status: 'Optimal',
            statusType: 'emerald',
            trend: '+2.1% velocity',
            trendType: 'up',
            icon: Activity,
            color: 'violet'
          },
          {
            title: 'Drug-Lab Contraindications',
            value: '0 Flags',
            unit: 'Active',
            normalRange: 'Metformin + Lisinopril',
            status: 'Safe',
            statusType: 'emerald',
            trend: 'Prescriptions Cleared',
            trendType: 'neutral',
            icon: ShieldCheck,
            color: 'emerald'
          }
        ].map((card) => {
          const Icon = card.icon;
          const TrendIcon = card.trendType === 'up' ? TrendingUp : card.trendType === 'down' ? TrendingDown : Minus;
          return (
            <motion.div
              key={card.title}
              variants={cardMotion}
              whileHover={{ y: -4, boxShadow: '0 12px 24px -10px rgba(14, 165, 233, 0.15)' }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.title}</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  card.statusType === 'emerald'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {card.status}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl font-black text-slate-900 tracking-tight">{card.value}</span>
                <span className="text-xs font-semibold text-slate-400">{card.unit}</span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50 text-xs">
                <span className="text-slate-400 font-mono text-[11px]">{card.normalRange}</span>
                <span className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                  card.trendType === 'up' ? 'text-emerald-600' : card.trendType === 'down' ? 'text-sky-600' : 'text-slate-500'
                }`}>
                  <TrendIcon size={12} />
                  {card.trend}
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Main 12-Column Responsive Workspace ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Longitudinal Health Profile (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">Longitudinal Health Profile</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                  Time-Series Velocity
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Mapping temporal biomarker trajectories across consecutive lab visits
              </p>
            </div>

            {/* Interactive Biomarker Toggle Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { key: 'wbc', label: 'WBC', color: '#0ea5e9' },
                { key: 'rbc', label: 'RBC', color: '#f43f5e' },
                { key: 'hgb', label: 'Hgb', color: '#8b5cf6' },
                { key: 'platelets', label: 'Plt', color: '#10b981' },
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => toggleLine(item.key)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                    activeLines[item.key]
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: activeLines[item.key] ? item.color : '#cbd5e1' }}
                  />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recharts Graph */}
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={INITIAL_LONGITUDINAL_DATA} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  formatter={(value) => <span className="text-slate-600 font-medium">{value}</span>}
                />
                {activeLines.wbc && (
                  <Line
                    type="monotone"
                    dataKey="wbc"
                    stroke="#0ea5e9"
                    name="WBC (K/µL)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }}
                  />
                )}
                {activeLines.rbc && (
                  <Line
                    type="monotone"
                    dataKey="rbc"
                    stroke="#f43f5e"
                    name="RBC (M/µL)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#f43f5e', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }}
                  />
                )}
                {activeLines.hgb && (
                  <Line
                    type="monotone"
                    dataKey="hgb"
                    stroke="#8b5cf6"
                    name="Hemoglobin (g/dL)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                  />
                )}
                {activeLines.platelets && (
                  <Line
                    type="monotone"
                    dataKey="platelets"
                    stroke="#10b981"
                    name="Platelets (K/µL ÷ 20)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Clinical Insight Footer */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 flex items-start gap-3 text-xs text-slate-600">
            <Info size={16} className="text-sky-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Longitudinal Velocity Observation</p>
              <p className="mt-0.5 text-slate-500 leading-relaxed">
                Hemoglobin and WBC trajectories reflect sustained physiological equilibrium across all 6 clinical checkpoints.
                No subclinical drift towards leukopenia or anemia observed.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Gemini AI Lab Parser & Safety Gate (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white">
                  <Cpu size={15} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Gemini Clinical Safety Gate</h2>
                  <p className="text-xs text-slate-400">Extracts biomarkers &amp; flags drug-lab contraindications</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold border border-emerald-200">
                LLM Ready
              </span>
            </div>

            {/* Active Patient Prescriptions Indicator */}
            <div className="mt-3 bg-blue-50/60 rounded-xl p-2.5 border border-blue-100">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="font-semibold text-blue-900 flex items-center gap-1">
                  <Pill size={12} className="text-blue-600" />
                  Active Prescriptions to Cross-Check:
                </span>
                <button
                  onClick={() => onSwitchTab('account')}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Manage ({prescriptions.length})
                </button>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {prescriptions.map(p => (
                  <span
                    key={p.name}
                    className="inline-flex items-center gap-1 text-[11px] bg-white px-2 py-0.5 rounded-md font-medium text-slate-700 border border-blue-200/80 shadow-xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {p.name} ({p.dosage})
                  </span>
                ))}
              </div>
            </div>

            {/* Ingestion Mode Toggle */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                <button
                  onClick={() => setInputMode('text')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    inputMode === 'text' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Paste Report Text
                </button>
                <button
                  onClick={() => setInputMode('file')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    inputMode === 'file' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Upload File (PDF/Image)
                </button>
              </div>

              {/* Sample Fill Buttons */}
              {inputMode === 'text' && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setReportText(SAMPLE_NORMAL_REPORT); setError(null); }}
                    className="text-[11px] font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 py-1 rounded-lg transition-colors"
                    title="Loads normal CBC + CMP values"
                  >
                    + Normal Sample
                  </button>
                  <button
                    onClick={() => { setReportText(SAMPLE_CONTRAINDICATION_REPORT); setError(null); }}
                    className="text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg transition-colors"
                    title="Loads critical Potassium report triggering ACE-Inhibitor alert"
                  >
                    + Trigger Alert
                  </button>
                </div>
              )}
            </div>

            {/* Input Area */}
            {inputMode === 'text' ? (
              <div className="mt-2.5">
                <textarea
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-xs font-mono text-slate-800
                             placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 resize-y min-h-[140px] leading-relaxed"
                  placeholder="Paste unstructured lab report text here..."
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                />
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file) setSelectedFile(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`mt-2.5 flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed cursor-pointer transition-all min-h-[140px] ${
                  dragOver ? 'border-sky-500 bg-sky-50/60' : selectedFile ? 'border-emerald-400 bg-emerald-50/40' : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />
                {selectedFile ? (
                  <div className="text-center">
                    <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-1" />
                    <p className="text-xs font-bold text-slate-800">{selectedFile.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{(selectedFile.size / 1024).toFixed(1)} KB — Click to change</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <FlaskConical size={24} className="text-slate-400 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-slate-700">Drop lab report PDF or Image</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF, PNG, JPEG, WEBP (Max 10MB)</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="space-y-3">
            <button
              onClick={handleAnalyze}
              disabled={loading || (inputMode === 'text' ? !reportText.trim() : !selectedFile)}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white
                         bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700
                         disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-sky-500/20 transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin text-white" />
                  <span>Synthesizing with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Zap size={16} className="text-amber-300" />
                  <span>Parse &amp; Analyze with Gemini</span>
                </>
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <strong>Analysis Error:</strong> {error}
                </div>
              </div>
            )}

            {/* Results Panel */}
            {(biomarkerList.length > 0 || safetyAnalysis) && (
              <div className="space-y-3 pt-2 border-t border-slate-100 max-h-72 overflow-y-auto pr-1">
                {/* Safety Alert Banner */}
                {safetyAnalysis && (
                  <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                    hasSafetyFlag
                      ? 'bg-rose-50/90 border-rose-200 text-rose-900'
                      : 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                  }`}>
                    <div className="flex items-center gap-2 font-bold mb-1">
                      {hasSafetyFlag ? (
                        <>
                          <AlertTriangle size={15} className="text-rose-600" />
                          <span className="text-rose-700 uppercase tracking-wide text-[11px]">Pharmacological Safety Flag Detected</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={15} className="text-emerald-600" />
                          <span className="text-emerald-700 uppercase tracking-wide text-[11px]">Prescription Clearance: Safe</span>
                        </>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap">{safetyAnalysis}</p>
                  </div>
                )}

                {/* Extracted Biomarker Pills */}
                {biomarkerList.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Extracted Biomarkers ({biomarkerList.length})
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {biomarkerList.map((bm, idx) => {
                        const statusLower = bm.status?.toLowerCase() || 'default';
                        const isHigh = statusLower.includes('high') || statusLower.includes('critical');
                        const isLow = statusLower.includes('low');
                        return (
                          <div
                            key={idx}
                            className={`flex justify-between items-center px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                              isHigh
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : isLow
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            <span className="truncate pr-1">{bm.label}</span>
                            <span className="font-bold shrink-0">{bm.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// VIEW 2: Reports (Historical Records & Safety Logs)
// ─────────────────────────────────────────────────────────────────────────────

const ReportsView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [reports] = useState(INITIAL_REPORTS);
  const [selectedReport, setSelectedReport] = useState(null);

  const filteredReports = reports.filter(r => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.panel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.summary.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'safe') return matchesSearch && r.status === 'Safe';
    if (filter === 'flagged') return matchesSearch && r.status === 'Flagged';
    return matchesSearch;
  });

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Diagnostic Reports &amp; Audit Logs</h2>
          <p className="text-xs text-slate-500 mt-0.5">Chronological repository of analyzed lab results and contraindication verdicts</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-xs">
            Total Stored: <strong>{reports.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Report ID, Panel, or extracted Biomarker..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-xs"
          />
        </div>
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'all', label: 'All Records' },
            { id: 'safe', label: 'Safe (No Flags)' },
            { id: 'flagged', label: 'Contraindication Alerts' },
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                filter === btn.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <motion.div variants={staggerChildren} initial="initial" animate="animate" className="space-y-3">
        {filteredReports.map(rpt => (
          <motion.div
            key={rpt.id}
            variants={cardMotion}
            whileHover={{ x: 4 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-extrabold text-sm text-slate-900 font-mono">{rpt.id}</span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">{rpt.date}</span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                  {rpt.panel}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  rpt.status === 'Safe'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {rpt.safetyFlag}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-mono bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                {rpt.summary}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                <span>Facility: {rpt.lab}</span>
                <span>•</span>
                <span>{rpt.biomarkersCount} Extracted Biomarkers</span>
                <span>•</span>
                <span>Trajectory: {rpt.trend}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedReport(rpt)}
              className="self-start md:self-center shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-all"
            >
              <span>View Audit Details</span>
              <ArrowRight size={13} />
            </button>
          </motion.div>
        ))}

        {filteredReports.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
            <ClipboardList size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No matching reports found</p>
            <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search criteria or filter tags</p>
          </div>
        )}
      </motion.div>

      {/* Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">{selectedReport.id} Clinical Audit</h3>
                <p className="text-xs text-slate-400">{selectedReport.date} — {selectedReport.lab}</p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Panel Type</p>
                <p className="font-semibold text-slate-800 text-sm mt-0.5">{selectedReport.panel}</p>
              </div>
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Extracted Values</p>
                <p className="p-3 bg-slate-50 rounded-xl font-mono text-slate-700 mt-1 border border-slate-100">
                  {selectedReport.summary}
                </p>
              </div>
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Pharmacological Clearance</p>
                <div className={`mt-1 p-3 rounded-xl border font-medium ${
                  selectedReport.status === 'Safe'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {selectedReport.safetyFlag}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
              >
                Close Audit View
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// VIEW 3: About Us (System Architecture & Project Overview)
// ─────────────────────────────────────────────────────────────────────────────

const AboutView = () => {
  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-8">

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-2 pt-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
          <Stethoscope size={13} />
          B.Tech CSE Major Project — 2026-2027
        </span>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          MedPulse-<span className="text-sky-500">X</span> Architecture
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          An LLM-driven Clinical Decision Support System designed to eliminate diagnostic blind spots caused by static,
          isolated laboratory reports and manual medication cross-referencing.
        </p>
      </div>

      {/* Existing vs Proposed System Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-rose-50/50 rounded-3xl p-6 border border-rose-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertCircle size={20} />
            <h3 className="font-bold text-base">Existing Medical Workflow (Limitations)</h3>
          </div>
          <ul className="space-y-2.5 text-xs text-rose-900/80 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold shrink-0">✕</span>
              <span><strong>Isolated Static Snapshots:</strong> Clinicians review only the latest report in isolation, missing long-term biomarker drift.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold shrink-0">✕</span>
              <span><strong>Manual Drug-Lab Checks:</strong> Practitioners must manually recall all contraindication tables for multiple prescribed drugs under time pressure.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold shrink-0">✕</span>
              <span><strong>Format Fragmentation:</strong> Medical records scattered across incompatible hospital PDFs, paper printouts, and messaging apps.</span>
            </li>
          </ul>
        </div>

        <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 size={20} />
            <h3 className="font-bold text-base">MedPulse-X Proposed Architecture</h3>
          </div>
          <ul className="space-y-2.5 text-xs text-emerald-900/80 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold shrink-0">✓</span>
              <span><strong>Temporal Trajectory Tracking:</strong> Interactive Recharts visualisations calculate velocity metrics across multi-year baselines.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold shrink-0">✓</span>
              <span><strong>Automated Gemini Safety Gate:</strong> Instant zero-shot pharmacological cross-checking flags hazardous drug-lab interactions (e.g. ACE-I hyperkalemia).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold shrink-0">✓</span>
              <span><strong>Multimodal Ingestion:</strong> Ingests unstructured text, scanned PDFs, and high-resolution photo prints seamlessly.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 3-Step Core Clinical Workflow */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-black text-slate-900">3-Step Operational Pipeline</h3>
          <p className="text-xs text-slate-500 mt-0.5">End-to-end data pipeline from document ingestion to clinical decision support</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              step: '01',
              title: 'Multimodal Parsing',
              desc: 'Ingests digital lab text, PDFs, or camera scans. Gemini LLM extracts biomarker labels, numeric values, units, and ranges into strict JSON schema.',
              icon: FileText,
              color: 'sky'
            },
            {
              step: '02',
              title: 'Longitudinal Profiling',
              desc: 'Persists structured data in MongoDB Atlas. Recharts generates time-indexed curves computing velocity changes across historical reports.',
              icon: TrendingUp,
              color: 'violet'
            },
            {
              step: '03',
              title: 'Pharmacological Safety Gate',
              desc: 'Cross-references active patient medications against latest parameters. Generates structured risk classifications with medical rationale.',
              icon: ShieldCheck,
              color: 'emerald'
            }
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-slate-300 font-mono">{item.step}</span>
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
                    <Icon size={16} />
                  </div>
                </div>
                <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Technology Stack Badges */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Production Technology Stack</h3>
          <span className="text-xs text-sky-400 font-mono">Full-Stack MERN + LLM</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { name: 'React.js (v18)', role: 'Frontend Single Page App' },
            { name: 'Tailwind CSS (v3)', role: 'Clinical Design System' },
            { name: 'Framer Motion', role: 'Fluid Layout Animations' },
            { name: 'Recharts', role: 'Time-Series Visualisation' },
            { name: 'Node.js & Express', role: 'RESTful API Services' },
            { name: 'MongoDB Atlas', role: 'Cloud NoSQL Data Layer' },
            { name: 'Google Gemini API', role: 'LLM Extraction & Safety' },
            { name: 'JWT Authentication', role: 'Cryptographic Auth Guards' },
          ].map(tech => (
            <div key={tech.name} className="p-3 bg-white/5 border border-white/10 rounded-2xl">
              <p className="text-xs font-bold text-white">{tech.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{tech.role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Project Team Credits */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">Project Development Team</h3>
          <p className="text-xs text-slate-500">Malla Reddy University, Hyderabad — Department of Computer Science and Engineering</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { name: 'Sareddy Lokesh Reddy', roll: '2311CS010608' },
            { name: 'Bonthu Satvik Naga Surya', roll: '2311CS010106' },
            { name: 'Damerla Ganesh', roll: '2311CS010194' },
            { name: 'Madupalli Hariprasad', roll: '2311CS010397' }
          ].map(member => (
            <div key={member.roll} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold mb-2">
                {member.name.charAt(0)}
              </div>
              <p className="text-xs font-bold text-slate-900">{member.name}</p>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">{member.roll}</p>
            </div>
          ))}
        </div>
      </div>

    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// VIEW 4: Help (User Guide & One-Click Test Data)
// ─────────────────────────────────────────────────────────────────────────────

const HelpView = ({ onSwitchToParserWithSample }) => {
  const [openFaq, setOpenFaq] = useState(0);
  const [copiedSample1, setCopiedSample1] = useState(false);
  const [copiedSample2, setCopiedSample2] = useState(false);

  const copyToClipboard = (text, setFlag) => {
    navigator.clipboard.writeText(text);
    setFlag(true);
    setTimeout(() => setFlag(false), 2000);
  };

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Help, Documentation &amp; Test Suite</h2>
        <p className="text-xs text-slate-500 mt-0.5">Instant test data and clinical usage guidance for evaluating MedPulse-X</p>
      </div>

      {/* One-Click Test Data Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Sample 1: Safe Normal Report */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={11} /> Test Case 1: Normal Lab Profile
              </span>
              <button
                onClick={() => copyToClipboard(SAMPLE_NORMAL_REPORT, setCopiedSample1)}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
              >
                {copiedSample1 ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                <span>{copiedSample1 ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <h3 className="font-bold text-sm text-slate-900 mt-2">Baseline Healthy Profile (Safe Clearance)</h3>
            <p className="text-xs text-slate-500 mt-0.5">WBC 5.2, RBC 4.35, Hgb 13.8, K+ 4.2. Safe with Metformin + Lisinopril.</p>
            <pre className="mt-2.5 bg-slate-50 rounded-xl p-3 text-[11px] font-mono text-slate-700 max-h-36 overflow-y-auto border border-slate-100">
              {SAMPLE_NORMAL_REPORT}
            </pre>
          </div>

          <button
            onClick={() => onSwitchToParserWithSample(SAMPLE_NORMAL_REPORT)}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition-colors"
          >
            <span>Load into Parser &amp; Test</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Sample 2: Contraindication Trigger Report */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                <AlertTriangle size={11} /> Test Case 2: Contraindication Flag
              </span>
              <button
                onClick={() => copyToClipboard(SAMPLE_CONTRAINDICATION_REPORT, setCopiedSample2)}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
              >
                {copiedSample2 ? <Check size={12} className="text-rose-500" /> : <Copy size={12} />}
                <span>{copiedSample2 ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <h3 className="font-bold text-sm text-slate-900 mt-2">Critical Hyperkalemia &amp; Renal Impairment</h3>
            <p className="text-xs text-slate-500 mt-0.5">K+ 5.9 (ACE-I conflict with Lisinopril) &amp; eGFR 24 (Metformin contraindication).</p>
            <pre className="mt-2.5 bg-slate-50 rounded-xl p-3 text-[11px] font-mono text-slate-700 max-h-36 overflow-y-auto border border-slate-100">
              {SAMPLE_CONTRAINDICATION_REPORT}
            </pre>
          </div>

          <button
            onClick={() => onSwitchToParserWithSample(SAMPLE_CONTRAINDICATION_REPORT)}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors"
          >
            <span>Trigger Safety Gate Flag Test</span>
            <ArrowRight size={13} />
          </button>
        </div>

      </div>

      {/* FAQ Accordions */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3">
        <h3 className="text-base font-extrabold text-slate-900 mb-2">Frequently Asked Questions</h3>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
              <button
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                className="w-full flex items-center justify-between p-4 text-left text-xs font-bold text-slate-800 hover:bg-slate-100/50 transition-colors"
              >
                <span>{faq.q}</span>
                {openFaq === i ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="p-4 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// VIEW 5: Account (Patient Profile & Active Medicines Manager)
// ─────────────────────────────────────────────────────────────────────────────

const AccountView = ({ prescriptions, setPrescriptions, onLogout }) => {
  const token = getToken();
  const tokenPreview = token ? `${token.slice(0, 22)}...${token.slice(-10)}` : 'No active session token';

  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedFreq, setNewMedFreq] = useState('Once Daily (QD)');
  const [newMedCategory, setNewMedCategory] = useState('');
  const [newMedMonitored, setNewMedMonitored] = useState('');
  const [newMedWarning, setNewMedWarning] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddMedication = (e) => {
    e.preventDefault();
    if (!newMedName.trim() || !newMedDosage.trim()) return;

    const newMed = {
      id: `rx-${Date.now()}`,
      name: newMedName.trim(),
      dosage: newMedDosage.trim(),
      frequency: newMedFreq,
      category: newMedCategory.trim() || 'General Prescription',
      monitoredBiomarkers: newMedMonitored ? newMedMonitored.split(',').map(s => s.trim()) : ['Routine Check'],
      contraindicationWarning: newMedWarning.trim() || 'Monitor standard therapeutic range.',
      active: true
    };

    setPrescriptions(prev => [...prev, newMed]);
    setNewMedName('');
    setNewMedDosage('');
    setNewMedCategory('');
    setNewMedMonitored('');
    setNewMedWarning('');
    setShowAddModal(false);
  };

  const handleRemoveMedication = (id) => {
    setPrescriptions(prev => prev.filter(p => p.id !== id));
  };

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Patient Clinical Profile &amp; Prescriptions</h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage patient identity, session authentication guards, and active medications for contraindication checking</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Patient Profile & JWT Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-sky-500/20">
                S
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Satvik Naga Surya</h3>
                <p className="text-xs text-slate-500">2311cs010106@mallareddyuniversity.ac.in</p>
                <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Clinical Session
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400">Patient Identifier:</span>
                <span className="font-bold text-slate-800 font-mono">MPX-90412</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400">Blood Group:</span>
                <span className="font-bold text-slate-800">O+ (Rh Positive)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400">Primary Care Unit:</span>
                <span className="font-bold text-slate-800">Internal Medicine</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Database Record ID:</span>
                <span className="font-bold text-slate-800 font-mono text-[11px]">{DEMO_USER_ID}</span>
              </div>
            </div>
          </div>

          {/* JWT Security Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Lock size={13} className="text-sky-500" />
                JWT Security Signature
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                HS256 7-Day Expiry
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Every API transaction is encrypted and checked by Axios request interceptors verifying the local bearer token.
            </p>
            <div className="bg-slate-900 rounded-xl p-3 font-mono text-[11px] text-emerald-400 truncate">
              {tokenPreview}
            </div>
            <button
              onClick={onLogout}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors"
            >
              <LogOut size={14} />
              <span>Terminate Session (Sign Out)</span>
            </button>
          </div>
        </div>

        {/* Active Medicines Manager (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Pill size={16} className="text-sky-500" />
                Active Patient Prescriptions
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Cross-referenced automatically by Gemini AI against incoming lab reports
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-xs transition-all"
            >
              <Plus size={14} />
              <span>Add Medication</span>
            </button>
          </div>

          {/* Medicines List */}
          <div className="space-y-3">
            {prescriptions.map((med) => (
              <div key={med.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">{med.name}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                        {med.dosage}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">{med.frequency}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{med.category}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveMedication(med.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Remove prescription"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="pt-1 text-xs">
                  <div className="flex items-center gap-1 text-slate-600 font-medium">
                    <span className="text-[11px] text-slate-400">Monitored Biomarkers:</span>
                    <div className="flex gap-1 flex-wrap">
                      {med.monitoredBiomarkers.map((bm, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-700">
                          {bm}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 p-2 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px] leading-snug flex items-start gap-1.5">
                    <AlertTriangle size={13} className="shrink-0 text-amber-600 mt-0.5" />
                    <span><strong>Contraindication Rule:</strong> {med.contraindicationWarning}</span>
                  </div>
                </div>
              </div>
            ))}

            {prescriptions.length === 0 && (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Pill size={28} className="mx-auto text-slate-300 mb-1" />
                <p className="text-xs font-bold text-slate-600">No active medications registered</p>
                <p className="text-[11px] text-slate-400">Add medications above to activate automated contraindication screening</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Plus size={16} className="text-sky-500" />
                Add Active Medication
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMedication} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Medication Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Warfarin, Atorvastatin, Metformin"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">Dosage</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5 mg, 500 mg"
                    value={newMedDosage}
                    onChange={(e) => setNewMedDosage(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Frequency</label>
                  <select
                    value={newMedFreq}
                    onChange={(e) => setNewMedFreq(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    <option>Once Daily (QD)</option>
                    <option>Twice Daily (BID)</option>
                    <option>Three Times Daily (TID)</option>
                    <option>As Needed (PRN)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Drug Class / Category</label>
                <input
                  type="text"
                  placeholder="e.g. Anticoagulant, Statin, ACE Inhibitor"
                  value={newMedCategory}
                  onChange={(e) => setNewMedCategory(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Monitored Biomarkers (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. INR, PT, Platelets, ALT"
                  value={newMedMonitored}
                  onChange={(e) => setNewMedMonitored(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Contraindication Trigger Warning</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Alert if INR exceeds 3.5 or ALT > 3x normal limit."
                  value={newMedWarning}
                  onChange={(e) => setNewMedWarning(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold shadow-xs"
                >
                  Save Prescription
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Application Shell & Glassmorphic Navigation Bar
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'home', label: 'Home', icon: Activity },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'about', label: 'About Us', icon: Info },
  { id: 'help', label: 'Help', icon: HelpCircle },
  { id: 'account', label: 'Account', icon: User },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [prescriptions, setPrescriptions] = useState(INITIAL_PRESCRIPTIONS);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const handleSwitchToParserWithSample = (sampleText) => {
    setActiveTab('home');
    // Using small timeout to allow Home tab mounting if coming from Help
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.value = sampleText;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 100);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView prescriptions={prescriptions} onSwitchTab={setActiveTab} />;
      case 'reports':
        return <ReportsView />;
      case 'about':
        return <AboutView />;
      case 'help':
        return <HelpView onSwitchToParserWithSample={handleSwitchToParserWithSample} />;
      case 'account':
        return (
          <AccountView
            prescriptions={prescriptions}
            setPrescriptions={setPrescriptions}
            onLogout={handleLogout}
          />
        );
      default:
        return <HomeView prescriptions={prescriptions} onSwitchTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">

      {/* ── Sticky Glassmorphic Navbar ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/85 border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Brand Logo with Heartbeat Pulse */}
            <div className="flex items-center gap-2.5 shrink-0 cursor-pointer" onClick={() => setActiveTab('home')}>
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 via-blue-600 to-slate-900 flex items-center justify-center shadow-md shadow-sky-500/20">
                  <Activity size={18} className="text-white animate-pulse" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white ring-1 ring-emerald-400/50" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight leading-none flex items-center">
                  <span className="text-slate-900">Med</span>
                  <span className="text-sky-500">Pulse</span>
                  <span className="text-blue-600 font-extrabold">-X</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">
                  Clinical Decision Support
                </span>
              </div>
            </div>

            {/* Animated Tab Switcher (Desktop) */}
            <LayoutGroup id="nav-pill-group">
              <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="relative px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors z-10 flex items-center gap-1.5"
                      style={{ color: isActive ? '#0284c7' : '#64748b' }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="nav-pill"
                          className="absolute inset-0 bg-white rounded-xl shadow-xs"
                          style={{ zIndex: -1 }}
                          transition={{ type: 'spring', stiffness: 450, damping: 38 }}
                        />
                      )}
                      <Icon size={14} className={isActive ? 'text-sky-600' : 'text-slate-400'} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </LayoutGroup>

            {/* Right Status Badges & Actions */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Gemini AI Status Badge */}
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Safety Gate: Active</span>
              </div>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors relative"
                  title="Notifications"
                >
                  <Bell size={17} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-500 ring-2 ring-white" />
                </button>

                {/* Notifications Popover */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 text-xs space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="font-bold text-slate-800">System Notifications</span>
                      <span className="text-[10px] text-sky-600 font-semibold">2 New</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="font-bold text-slate-800">Model Updated: Gemini 1.5 Flash</p>
                        <p className="text-[11px] text-slate-400">Low-latency clinical extraction ready.</p>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-800">
                        <p className="font-bold">Drug Clearance Check Passed</p>
                        <p className="text-[11px] text-emerald-600">Metformin &amp; Lisinopril compatible with latest labs.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sign Out Button */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-xl hover:bg-rose-50 transition-colors"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>

          {/* Mobile Tab Bar */}
          <div className="flex md:hidden overflow-x-auto gap-1 pb-2 scrollbar-none">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon size={13} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Page Content ─────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <AnimatePresence mode="wait">
          <React.Fragment key={activeTab}>
            {renderActiveView()}
          </React.Fragment>
        </AnimatePresence>
      </main>

    </div>
  );
};

export default Dashboard;

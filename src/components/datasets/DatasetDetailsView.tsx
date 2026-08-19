import React, { useState, useEffect } from 'react';
import { Dataset } from '../../types/dataset';
import {
  DatasetProfile,
  ColumnProfile,
  ProfilingProgressUpdate,
  ProfilingStatus,
} from '../../types/dataProfile';
import {
  profileDataset,
  getDatasetProfile,
} from '../../services/profilingService';
import { QualityScoreGauge } from '../profiling/QualityScoreGauge';
import { ProfilingProgressModal } from '../profiling/ProfilingProgressModal';
import { ColumnDetailModal } from '../profiling/ColumnDetailModal';
import { DuplicateRowsModal } from '../profiling/DuplicateRowsModal';
import { DataIssuesList } from '../profiling/DataIssuesList';
import { ColumnOverviewTable } from '../profiling/ColumnOverviewTable';
import { MissingValuesMatrix } from '../profiling/MissingValuesMatrix';
import {
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  Edit2,
  Trash2,
  Table as TableIcon,
  CheckCircle2,
  Calendar,
  HardDrive,
  Layers,
  Database,
  Download,
  Sparkles,
  RefreshCw,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  BarChart2,
  Wand2,
  Bot,
  Copy,
  Info,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface DatasetDetailsViewProps {
  dataset: Dataset;
  onBack: () => void;
  onRename: (dataset: Dataset) => void;
  onDelete: (dataset: Dataset) => void;
  onNavigateToAnalyst?: (dataset: Dataset) => void;
}

type TabType = 'overview' | 'preview' | 'profile' | 'quality' | 'preparation';

export const DatasetDetailsView: React.FC<DatasetDetailsViewProps> = ({
  dataset,
  onBack,
  onRename,
  onDelete,
  onNavigateToAnalyst,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isProfiling, setIsProfiling] = useState(false);
  const [profilingProgress, setProfilingProgress] = useState<ProfilingProgressUpdate>({
    stage: 'initializing',
    message: '',
    percentage: 0,
  });
  const [selectedColumn, setSelectedColumn] = useState<ColumnProfile | null>(null);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [showReProfileConfirm, setShowReProfileConfirm] = useState(false);
  const [profilingError, setProfilingError] = useState<string | null>(null);

  const isExcel = dataset.fileType === 'xlsx' || dataset.fileType === 'xls';

  // Load existing profile from Firestore/Local
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoadingProfile(true);
      try {
        const existing = await getDatasetProfile(dataset.userId, dataset.datasetId);
        if (isMounted && existing) {
          setProfile(existing);
        }
      } catch (err) {
        console.warn('Error loading dataset profile:', err);
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [dataset.datasetId, dataset.userId]);

  const handleStartProfiling = async () => {
    setShowReProfileConfirm(false);
    setIsProfiling(true);
    setProfilingError(null);

    try {
      const result = await profileDataset(dataset, (progress) => {
        setProfilingProgress(progress);
      });
      setProfile(result);
    } catch (err: any) {
      console.error('Profiling execution failed:', err);
      setProfilingError(err.message || 'Failed to profile dataset. Please try again.');
    } finally {
      setIsProfiling(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateVal: any) => {
    if (!dateVal) return 'Recently';
    try {
      const date = new Date(dateVal);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recently';
    }
  };

  const sample = dataset.previewSample;
  const isProfiled = Boolean(profile && profile.status === 'profiled');

  // Column counts by logical type
  const typeCounts = profile?.columns.reduce((acc, col) => {
    const t =
      col.logicalType === 'integer' || col.logicalType === 'decimal' || col.logicalType === 'numeric'
        ? 'numeric'
        : col.logicalType;
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:border-indigo-200 transition-colors cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Datasets</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Re-Profile or Profile Trigger */}
          {isProfiled ? (
            <button
              onClick={() => setShowReProfileConfirm(true)}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Re-profile Dataset</span>
            </button>
          ) : (
            <button
              onClick={handleStartProfiling}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Profile Dataset</span>
            </button>
          )}

          {/* Ask AI Trigger */}
          {onNavigateToAnalyst && (
            <button
              onClick={() => onNavigateToAnalyst(dataset)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Ask InsightAI</span>
            </button>
          )}

          <button
            onClick={() => onRename(dataset)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Rename dataset"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Rename</span>
          </button>

          <button
            onClick={() => onDelete(dataset)}
            className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Delete dataset"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* Dataset Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                isExcel
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  : 'bg-blue-50 text-blue-600 border border-blue-100'
              }`}
            >
              {isExcel ? <FileSpreadsheet className="w-7 h-7" /> : <FileText className="w-7 h-7" />}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {dataset.fileType}
                </span>
                {dataset.selectedSheet && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    Sheet: {dataset.selectedSheet}
                  </span>
                )}
                {isProfiled ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Profiled • Quality: {profile?.qualityScore}/100</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Ready for Profiling</span>
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {dataset.name}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Source File: <span className="font-semibold text-slate-600">{dataset.originalFileName}</span>
              </p>
            </div>
          </div>

          {/* Quick Quality Score Metric Pill (if profiled) */}
          {isProfiled && profile && (
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Quality Grade
                </span>
                <span className="text-sm font-extrabold text-slate-900">
                  {profile.qualitySummary.grade} ({profile.qualityScore}/100)
                </span>
              </div>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-2xs ${
                  profile.qualityScore >= 90
                    ? 'bg-emerald-500'
                    : profile.qualityScore >= 75
                    ? 'bg-indigo-600'
                    : profile.qualityScore >= 60
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              >
                {profile.qualityScore}
              </div>
            </div>
          )}
        </div>

        {/* Core Metadata Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Rows</span>
            <span className="text-base font-extrabold text-slate-900">
              {(profile?.rowCount || dataset.rowCount).toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Columns</span>
            <span className="text-base font-extrabold text-slate-900">
              {profile?.columnCount || dataset.columnCount}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">File Size</span>
            <span className="text-base font-extrabold text-slate-900">
              {formatFileSize(dataset.fileSize)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {isProfiled ? 'Profiled At' : 'Uploaded At'}
            </span>
            <span className="text-base font-extrabold text-slate-900">
              {formatDate(profile?.profiledAt || dataset.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'preview'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>Data Preview</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Column Profile</span>
          {profile && (
            <span className="px-1.5 py-0.2 rounded-full bg-slate-700 text-[10px] text-white">
              {profile.columns.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('quality')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'quality'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Data Quality</span>
          {profile && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                profile.qualityScore >= 80 ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
              }`}
            >
              {profile.qualityScore}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('preparation')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'preparation'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Data Preparation</span>
        </button>
      </div>

      {/* Profiling Error Notice */}
      {profilingError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-700">
          <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Profiling Failed</span>
            <span>{profilingError}</span>
          </div>
        </div>
      )}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Not Profiled Callout Banner */}
          {!isProfiled && !isLoadingProfile && (
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="relative z-10 max-w-xl space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Automated Data Health & Profiling</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Discover Data Types, Outliers & Health Metrics
                </h3>

                <p className="text-xs sm:text-sm text-indigo-100/80 leading-relaxed font-medium">
                  Run InsightAI's statistical engine to automatically classify column formats, detect potential 1.5× IQR outliers, inspect missing cells, check duplicate rows, and generate a 0–100 Data Quality Score.
                </p>

                <div>
                  <button
                    onClick={handleStartProfiling}
                    className="px-6 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Run Data Profiling Now</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Profile Snapshot Summary (if profiled) */}
          {isProfiled && profile && (
            <>
              {/* Quality Gauge Hero */}
              <QualityScoreGauge
                quality={profile.qualitySummary}
                onViewIssues={() => setActiveTab('quality')}
              />

              {/* Column Types Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Numeric Fields
                  </span>
                  <span className="text-xl font-extrabold text-blue-600 mt-1 block">
                    {typeCounts['numeric'] || 0}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Integers and decimal numbers
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Categorical Fields
                  </span>
                  <span className="text-xl font-extrabold text-indigo-600 mt-1 block">
                    {typeCounts['categorical'] || 0}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Discrete category groups
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Date & Time Fields
                  </span>
                  <span className="text-xl font-extrabold text-purple-600 mt-1 block">
                    {typeCounts['date'] || typeCounts['datetime'] || 0}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Temporal event dates
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Text / Boolean Fields
                  </span>
                  <span className="text-xl font-extrabold text-slate-700 mt-1 block">
                    {(typeCounts['text'] || 0) + (typeCounts['boolean'] || 0)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Identifiers, flags, and strings
                  </span>
                </div>
              </div>

              {/* Ready for AI Analysis Box */}
              <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl p-5 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Profile Ready for AI Data Analyst
                    </h4>
                    <p className="text-xs text-slate-600 font-medium">
                      InsightAI uses this profile schema to accurately answer analytical questions and calculate metrics.
                    </p>
                  </div>
                </div>

                {onNavigateToAnalyst && (
                  <button
                    onClick={() => onNavigateToAnalyst(dataset)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-sm"
                  >
                    Open in Analyst →
                  </button>
                )}
              </div>
            </>
          )}

          {/* Data Sample Preview Box */}
          {sample && sample.columns && sample.columns.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <TableIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>First 5 Sample Records</span>
                </h4>
                <button
                  onClick={() => setActiveTab('preview')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Full Table Preview</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center text-slate-400">#</th>
                      {sample.columns.map((c, i) => (
                        <th key={i} className="py-2 px-3 whitespace-nowrap">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                    {sample.rows.slice(0, 5).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-indigo-50/20">
                        <td className="py-1.5 px-3 text-center text-slate-400 font-mono text-[10px] bg-slate-50/50">
                          {rIdx + 1}
                        </td>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="py-1.5 px-3 whitespace-nowrap truncate max-w-[200px]">
                            {cell !== null && cell !== '' ? String(cell) : <span className="text-slate-300 italic">null</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: DATA PREVIEW */}
      {activeTab === 'preview' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-indigo-600" />
                <span>Dataset Sample Preview</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Previewing top {sample?.rows.length || 0} rows across {sample?.columns.length || 0} columns
              </p>
            </div>
          </div>

          {sample && sample.columns && sample.columns.length > 0 ? (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto max-h-[500px] scrollbar-thin">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100/90 text-slate-700 font-bold sticky top-0 border-b border-slate-200 z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center text-slate-400 font-mono text-[10px] border-r border-slate-200/60">
                        #
                      </th>
                      {sample.columns.map((col, idx) => {
                        const colProfile = profile?.columns.find((c) => c.name === col);
                        return (
                          <th
                            key={idx}
                            className="py-2.5 px-3 text-slate-800 font-bold text-xs whitespace-nowrap border-r border-slate-200/60 last:border-r-0"
                          >
                            <div className="flex items-center gap-1.5">
                              <span>{col}</span>
                              {colProfile && (
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/80 text-slate-500 border border-slate-200">
                                  {colProfile.logicalType}
                                </span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                    {sample.rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-indigo-50/40 transition-colors">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[10px] bg-slate-50/50 border-r border-slate-200/60 select-none">
                          {rowIdx + 1}
                        </td>
                        {row.map((cell, colIdx) => (
                          <td
                            key={colIdx}
                            className="py-2 px-3 whitespace-nowrap border-r border-slate-200/60 last:border-r-0 max-w-[220px] truncate"
                          >
                            {cell !== null && cell !== '' ? (
                              String(cell)
                            ) : (
                              <span className="text-slate-300 italic font-mono text-[11px]">null</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No sample rows available for preview.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COLUMN PROFILE */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {!isProfiled ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center space-y-3">
              <BarChart2 className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">Dataset Not Profiled</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Profile this dataset to inspect individual column distributions, IQR outliers, and distinct counts.
              </p>
              <button
                onClick={handleStartProfiling}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/20"
              >
                Profile Dataset
              </button>
            </div>
          ) : (
            profile && (
              <>
                <ColumnOverviewTable
                  columns={profile.columns}
                  onSelectColumn={(col) => setSelectedColumn(col)}
                />

                <MissingValuesMatrix
                  columns={profile.columns}
                  totalRows={profile.rowCount}
                  onSelectColumn={(col) => setSelectedColumn(col)}
                />
              </>
            )
          )}
        </div>
      )}

      {/* TAB 4: DATA QUALITY */}
      {activeTab === 'quality' && (
        <div className="space-y-6">
          {!isProfiled ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center space-y-3">
              <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">Quality Metrics Uncalculated</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Run profiling to generate the composite 0–100 Data Quality score and review rule-based recommendations.
              </p>
              <button
                onClick={handleStartProfiling}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/20"
              >
                Calculate Data Quality
              </button>
            </div>
          ) : (
            profile && (
              <>
                {/* Quality Score Breakdown Card */}
                <QualityScoreGauge quality={profile.qualitySummary} />

                {/* Duplicates Alert Bar */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        profile.duplicateRowCount > 0
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}
                    >
                      <Copy className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {profile.duplicateRowCount > 0
                          ? `${profile.duplicateRowCount.toLocaleString()} Duplicate Records Detected (${profile.duplicateRowPercentage}%)`
                          : 'Zero Duplicate Records Detected'}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {profile.duplicateRowCount > 0
                          ? 'Duplicate rows may impact average or sum computations.'
                          : 'All rows in this dataset are distinct and unique.'}
                      </p>
                    </div>
                  </div>

                  {profile.duplicateRowCount > 0 && (
                    <button
                      onClick={() => setShowDuplicatesModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      View Duplicate Samples
                    </button>
                  )}
                </div>

                {/* Rule-Based Issues & Recommendations List */}
                <DataIssuesList
                  issues={profile.issues}
                  onSelectColumn={(colName) => {
                    const found = profile.columns.find((c) => c.name === colName);
                    if (found) setSelectedColumn(found);
                  }}
                />
              </>
            )
          )}
        </div>
      )}

      {/* TAB 5: DATA PREPARATION */}
      {activeTab === 'preparation' && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
            <Sliders className="w-7 h-7" />
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-slate-900">
              Data Preparation & Transformation Tools
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Automated data cleaning routines (imputing missing values, removing duplicates, clipping IQR outliers, dropping low-information columns, and schema type conversions) will be available in future phases.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 max-w-md mx-auto text-left text-xs text-slate-600 space-y-2">
            <span className="font-bold text-slate-800 block">Upcoming Capabilities:</span>
            <ul className="list-disc pl-4 space-y-1 text-slate-500">
              <li>Smart Imputation (Mean, Median, Mode, or Constant)</li>
              <li>Duplicate Record Deduplication</li>
              <li>Outlier Clipping & Trimming</li>
              <li>Column Renaming & Type Casting</li>
            </ul>
          </div>
        </div>
      )}

      {/* Modals & Dialogs */}
      
      {/* 1. Profiling Live Progress Modal */}
      <ProfilingProgressModal
        isOpen={isProfiling}
        progress={profilingProgress}
        datasetName={dataset.name}
      />

      {/* 2. Column Detail Drawer / Modal */}
      <ColumnDetailModal
        column={selectedColumn}
        onClose={() => setSelectedColumn(null)}
      />

      {/* 3. Duplicate Rows Modal */}
      {profile && (
        <DuplicateRowsModal
          isOpen={showDuplicatesModal}
          onClose={() => setShowDuplicatesModal(false)}
          duplicates={profile.duplicatePreview || []}
          columns={sample?.columns || profile.columns.map((c) => c.name)}
          totalDuplicates={profile.duplicateRowCount}
        />
      )}

      {/* 4. Re-Profile Confirmation Modal */}
      {showReProfileConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Re-profile Dataset?
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  This will re-calculate statistical moments, distributions, IQR outlier thresholds, and data quality metrics.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowReProfileConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleStartProfiling}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                Start Re-profiling
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

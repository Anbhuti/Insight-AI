import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  SlidersHorizontal,
  Share2,
  Download,
  Trash2,
  Copy,
  Crown,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  Database,
  CheckCircle2,
  FileSpreadsheet,
  Globe,
} from 'lucide-react';
import { Dataset } from '../../types/dataset';
import { DatasetProfile } from '../../types/dataProfile';
import { Report, ReportTemplateId } from '../../services/reports/reportTypes';
import { REPORT_TEMPLATES } from '../../services/reports/reportTemplates';
import {
  getReports,
  deleteReport,
  duplicateReport,
  getSharedReport,
} from '../../services/reports/reportService';
import { exportReportToExcel } from '../../services/reports/reportExportService';
import { CreateReportModal } from './CreateReportModal';
import { ReportViewer } from './ReportViewer';
import { ShareModal } from './ShareModal';
import { PermissionGate } from '../rbac/PermissionGate';

interface ReportsPageProps {
  userId?: string;
  userDisplayName?: string;
  userEmail?: string;
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  onSelectDataset?: (dataset: Dataset) => void;
  datasetProfiles: Record<string, DatasetProfile>;
  onNavigateToUpload?: () => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  userId = 'default_user',
  userDisplayName = 'User',
  userEmail = '',
  datasets,
  selectedDataset,
  onSelectDataset,
  datasetProfiles,
  onNavigateToUpload,
}) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [shareModalReport, setShareModalReport] = useState<Report | null>(null);

  // Check if URL hash has a shared report token: #report-share=token
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('report-share=')) {
      const token = hash.split('report-share=')[1]?.split('&')[0];
      if (token) {
        getSharedReport(token).then((shared) => {
          if (shared) {
            setActiveReport(shared);
          }
        });
      }
    }
  }, []);

  // Load user reports
  useEffect(() => {
    if (!userId) return;
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const list = await getReports(userId, selectedDataset?.datasetId);
        if (isMounted) {
          setReports(list);
        }
      } catch (err) {
        console.warn('Load reports error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [userId, selectedDataset]);

  const handleReportCreated = (newReport: Report) => {
    setReports([newReport, ...reports]);
    setShowCreateModal(false);
    setActiveReport(newReport);
  };

  const handleReportUpdated = (updated: Report) => {
    setReports(reports.map((r) => (r.metadata.reportId === updated.metadata.reportId ? updated : r)));
    if (activeReport?.metadata.reportId === updated.metadata.reportId) {
      setActiveReport(updated);
    }
  };

  const handleReportDeleted = (reportId: string) => {
    setReports(reports.filter((r) => r.metadata.reportId !== reportId));
    if (activeReport?.metadata.reportId === reportId) {
      setActiveReport(null);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, report: Report) => {
    e.stopPropagation();
    try {
      const dup = await duplicateReport(userId, report.metadata.datasetId, report.metadata.reportId);
      setReports([dup, ...reports]);
    } catch (err) {
      console.error('Duplicate error:', err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, report: Report) => {
    e.stopPropagation();
    if (window.confirm(`Delete report "${report.metadata.title}"?`)) {
      await deleteReport(userId, report.metadata.datasetId, report.metadata.reportId);
      setReports(reports.filter((r) => r.metadata.reportId !== report.metadata.reportId));
    }
  };

  const handleQuickExport = (e: React.MouseEvent, report: Report) => {
    e.stopPropagation();
    exportReportToExcel(report);
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.metadata.datasetName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.metadata.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // If a report is currently active, render the dedicated ReportViewer
  if (activeReport) {
    return (
      <ReportViewer
        report={activeReport}
        userId={userId}
        onBack={() => setActiveReport(null)}
        onReportUpdated={handleReportUpdated}
        onReportDeleted={handleReportDeleted}
      />
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <FileText className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Business Intelligence Reports
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Transform raw dataset analytics into publication-grade executive briefings, risk scorecards, and predictive horizon dossiers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <PermissionGate
              permission="report:create"
              fallback={
                <button
                  disabled
                  title="Your role (Viewer) cannot generate new reports"
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 text-slate-400 text-xs font-bold flex items-center gap-2 cursor-not-allowed opacity-60"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Report</span>
                </button>
              }
            >
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={datasets.length === 0}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Create Report</span>
              </button>
            </PermissionGate>
          </div>
        </div>

        {/* Quick Template Launch Strip */}
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { id: 'executive_briefing', name: 'Executive Brief', icon: Crown, color: 'text-amber-600 bg-amber-50' },
            { id: 'comprehensive_bi', name: 'Full BI Dossier', icon: FileText, color: 'text-indigo-600 bg-indigo-50' },
            { id: 'anomaly_risk', name: 'Risk & Anomaly', icon: AlertTriangle, color: 'text-rose-600 bg-rose-50' },
            { id: 'forecast_outlook', name: 'Forecast Outlook', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
            { id: 'data_quality_audit', name: 'Data Hygiene', icon: ShieldCheck, color: 'text-blue-600 bg-blue-50' },
            { id: 'custom_modular', name: 'Custom Modular', icon: Layers, color: 'text-purple-600 bg-purple-50' },
          ].map((tmpl) => {
            const IconComp = tmpl.icon;
            return (
              <button
                key={tmpl.id}
                onClick={() => setShowCreateModal(true)}
                className="p-3 rounded-2xl bg-slate-50/70 hover:bg-slate-100/90 border border-slate-200/60 text-left transition-all cursor-pointer space-y-1.5 group"
              >
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${tmpl.color}`}>
                  <IconComp className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-800 block truncate group-hover:text-indigo-600">
                  {tmpl.name}
                </span>
                <span className="text-[10px] text-slate-400 block">Instant Builder</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports or datasets..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['all', 'published', 'draft'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
          Loading report repository...
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-12 sm:p-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Reports Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {datasets.length === 0
                ? 'Upload your first dataset to start building executive business intelligence reports.'
                : 'Create your first grounded business intelligence dossier using our automated templates.'}
            </p>
          </div>
          {datasets.length > 0 ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Report</span>
            </button>
          ) : (
            <button
              onClick={onNavigateToUpload}
              className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              <span>Upload CSV / Excel Dataset</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReports.map((report) => {
            const tmplDef = REPORT_TEMPLATES[report.metadata.templateId] || REPORT_TEMPLATES.executive_briefing;

            return (
              <div
                key={report.metadata.reportId}
                onClick={() => setActiveReport(report)}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative space-y-4"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                      {tmplDef.badge}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        report.metadata.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {report.metadata.status}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                    {report.metadata.title}
                  </h3>
                  {report.metadata.subtitle && (
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {report.metadata.subtitle}
                    </p>
                  )}
                </div>

                {/* Metadata & Actions Strip */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-[130px] font-medium text-slate-600">
                        {report.metadata.datasetName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(report.metadata.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                        {report.sections.length} Sections
                      </span>
                      {report.sharing?.isShared && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          <span>Shared</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareModalReport(report);
                        }}
                        className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                        title="Share Link"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleQuickExport(e, report)}
                        className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-emerald-600 transition-colors"
                        title="Export to Excel (.xlsx)"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleDuplicate(e, report)}
                        className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleDelete(e, report)}
                        className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateReportModal
          userId={userId}
          authorName={userDisplayName}
          authorEmail={userEmail}
          datasets={datasets}
          selectedDataset={selectedDataset}
          datasetProfiles={datasetProfiles}
          onClose={() => setShowCreateModal(false)}
          onReportCreated={handleReportCreated}
        />
      )}

      {/* Share Modal */}
      {shareModalReport && (
        <ShareModal
          report={shareModalReport}
          userId={userId}
          onClose={() => setShareModalReport(null)}
          onReportUpdated={(updated) => {
            handleReportUpdated(updated);
            setShareModalReport(null);
          }}
        />
      )}
    </div>
  );
};

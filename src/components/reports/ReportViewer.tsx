import React, { useState } from 'react';
import {
  ArrowLeft,
  Share2,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Edit3,
  Check,
  Save,
  Trash2,
  Copy,
  Globe,
  Lock,
  Sparkles,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  Eye,
  Calendar,
  User,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { Report, ReportSection } from '../../services/reports/reportTypes';
import { ReportSectionsRenderer } from './sections/ReportSectionsRenderer';
import { ShareModal } from './ShareModal';
import {
  saveReport,
  deleteReport,
  duplicateReport,
} from '../../services/reports/reportService';
import {
  exportReportToExcel,
  exportReportToCSV,
  exportReportToJSON,
  printReportPDF,
} from '../../services/reports/reportExportService';

interface ReportViewerProps {
  report: Report;
  userId: string;
  onBack: () => void;
  onReportUpdated: (updated: Report) => void;
  onReportDeleted: (reportId: string) => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  report,
  userId,
  onBack,
  onReportUpdated,
  onReportDeleted,
}) => {
  const [currentReport, setCurrentReport] = useState<Report>(report);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveReport(userId, currentReport.metadata.datasetId, currentReport);
      setIsEditing(false);
      onReportUpdated(currentReport);
      setSaveNotice('Report saved successfully!');
      setTimeout(() => setSaveNotice(null), 3000);
    } catch (err) {
      console.error('Save report error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    const nextStatus = currentReport.metadata.status === 'published' ? 'draft' : 'published';
    const updated: Report = {
      ...currentReport,
      metadata: {
        ...currentReport.metadata,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      },
    };
    setCurrentReport(updated);
    await saveReport(userId, updated.metadata.datasetId, updated);
    onReportUpdated(updated);
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...currentReport.sections];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIdx];
    newSections[targetIdx] = temp;

    newSections.forEach((s, i) => (s.order = i + 1));
    setCurrentReport({ ...currentReport, sections: newSections });
  };

  const handleToggleSectionEnabled = (index: number) => {
    const newSections = [...currentReport.sections];
    newSections[index].enabled = !newSections[index].enabled;
    setCurrentReport({ ...currentReport, sections: newSections });
  };

  const handleUpdateSection = (updatedSection: ReportSection) => {
    const newSections = currentReport.sections.map((s) =>
      s.id === updatedSection.id ? updatedSection : s
    );
    setCurrentReport({ ...currentReport, sections: newSections });
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      await deleteReport(userId, currentReport.metadata.datasetId, currentReport.metadata.reportId);
      onReportDeleted(currentReport.metadata.reportId);
    }
  };

  const handleDuplicate = async () => {
    const dup = await duplicateReport(
      userId,
      currentReport.metadata.datasetId,
      currentReport.metadata.reportId
    );
    onReportUpdated(dup);
    setCurrentReport(dup);
    setSaveNotice('Duplicated report copy created!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200 print:m-0 print:p-0 print:max-w-none">
      {/* Top Action Bar (Hidden on Print) */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3 sticky top-4 z-40 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Back to Reports"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                  currentReport.metadata.status === 'published'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {currentReport.metadata.status}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {currentReport.metadata.datasetName}
              </span>
            </div>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {saveNotice && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{saveNotice}</span>
            </span>
          )}

          {/* Edit / View Mode Toggle */}
          <button
            onClick={() => {
              if (isEditing) {
                handleSave();
              } else {
                setIsEditing(true);
              }
            }}
            disabled={isSaving}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isEditing
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {isEditing ? (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Sections</span>
              </>
            )}
          </button>

          {/* Publish / Draft Toggle */}
          <button
            onClick={handleToggleStatus}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer hidden sm:flex items-center gap-1.5"
          >
            {currentReport.metadata.status === 'published' ? (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Set to Draft</span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>Publish</span>
              </>
            )}
          </button>

          {/* Share Button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            {showExportMenu && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl p-2 border border-slate-200 shadow-xl z-50 animate-in fade-in duration-150"
                onClick={() => setShowExportMenu(false)}
              >
                <button
                  onClick={() => exportReportToExcel(currentReport)}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="font-bold text-slate-900">Excel Workbook (.xlsx)</p>
                    <p className="text-[10px] text-slate-400">Multi-tab structured dossier</p>
                  </div>
                </button>

                <button
                  onClick={() => printReportPDF()}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-indigo-600" />
                  <div>
                    <p className="font-bold text-slate-900">Print / Save as PDF</p>
                    <p className="text-[10px] text-slate-400">Formatted executive pages</p>
                  </div>
                </button>

                <button
                  onClick={() => exportReportToCSV(currentReport)}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-amber-600" />
                  <div>
                    <p className="font-bold text-slate-900">CSV Export (.csv)</p>
                    <p className="text-[10px] text-slate-400">Key metrics summary</p>
                  </div>
                </button>

                <button
                  onClick={() => exportReportToJSON(currentReport)}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2.5 cursor-pointer"
                >
                  <Database className="w-4 h-4 text-slate-500" />
                  <div>
                    <p className="font-bold text-slate-900">Raw JSON Snapshot</p>
                    <p className="text-[10px] text-slate-400">Full structured payload</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* More Actions (Duplicate, Delete) */}
          <button
            onClick={handleDuplicate}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer hidden md:flex"
            title="Duplicate Report"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer hidden md:flex"
            title="Delete Report"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Report Document Canvas */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Cover / Header Section */}
        <div className="border-b border-slate-200/80 pb-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                InsightAI Executive Intelligence
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Grounded in Real Data</span>
              </span>
            </div>

            <div className="flex items-center gap-4 text-slate-400 text-xs">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(currentReport.metadata.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>{currentReport.metadata.authorName}</span>
              </div>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Report Title
                </label>
                <input
                  type="text"
                  value={currentReport.metadata.title}
                  onChange={(e) =>
                    setCurrentReport({
                      ...currentReport,
                      metadata: { ...currentReport.metadata, title: e.target.value },
                    })
                  }
                  className="w-full text-2xl font-black text-slate-900 border border-slate-300 rounded-xl p-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={currentReport.metadata.subtitle || ''}
                  onChange={(e) =>
                    setCurrentReport({
                      ...currentReport,
                      metadata: { ...currentReport.metadata, subtitle: e.target.value },
                    })
                  }
                  className="w-full text-sm text-slate-600 border border-slate-300 rounded-xl p-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          ) : (
            <div className="pt-2">
              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                {currentReport.metadata.title}
              </h1>
              {currentReport.metadata.subtitle && (
                <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
                  {currentReport.metadata.subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Render Sections */}
        <div className="space-y-6">
          {currentReport.sections
            .filter((s) => (isEditing ? true : s.enabled))
            .map((section, idx) => (
              <div key={section.id} className="relative group">
                {/* Editing Controls Bar for Section */}
                {isEditing && (
                  <div className="mb-2 p-2.5 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-900">
                        Section #{idx + 1}: {section.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          section.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {section.enabled ? 'Enabled' : 'Hidden'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleMoveSection(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded-lg bg-white hover:bg-indigo-100 text-slate-600 disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveSection(idx, 'down')}
                        disabled={idx === currentReport.sections.length - 1}
                        className="p-1 rounded-lg bg-white hover:bg-indigo-100 text-slate-600 disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleSectionEnabled(idx)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] cursor-pointer"
                      >
                        {section.enabled ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                )}

                <ReportSectionsRenderer
                  section={section}
                  isEditing={isEditing}
                  onUpdateSection={handleUpdateSection}
                />
              </div>
            ))}
        </div>

        {/* Footer / Provenance Badge */}
        <div className="pt-8 border-t border-slate-200 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-600">
              InsightAI Automated Analytical Architecture (v{currentReport.provenance.systemVersion})
            </p>
            <p className="text-[11px]">
              Grounded calculation timestamp: {new Date(currentReport.provenance.generatedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-bold text-slate-700">Analytical Source of Truth Verified</span>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          report={currentReport}
          userId={userId}
          onClose={() => setShowShareModal(false)}
          onReportUpdated={(updated) => {
            setCurrentReport(updated);
            onReportUpdated(updated);
          }}
        />
      )}
    </div>
  );
};

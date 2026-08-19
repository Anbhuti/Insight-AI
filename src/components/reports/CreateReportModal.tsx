import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Layers,
  FileText,
  Crown,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Sliders,
  Check,
  Loader2,
  Database,
  ArrowRight,
} from 'lucide-react';
import { Dataset } from '../../types/dataset';
import { DatasetProfile } from '../../types/dataProfile';
import { Report, ReportTemplateId, ReportSectionType } from '../../services/reports/reportTypes';
import { REPORT_TEMPLATES, SECTION_METADATA } from '../../services/reports/reportTemplates';
import { generateReportFromDataset } from '../../services/reports/reportBuilderService';

interface CreateReportModalProps {
  userId: string;
  authorName: string;
  authorEmail?: string;
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  datasetProfiles: Record<string, DatasetProfile>;
  onClose: () => void;
  onReportCreated: (report: Report) => void;
}

export const CreateReportModal: React.FC<CreateReportModalProps> = ({
  userId,
  authorName,
  authorEmail,
  datasets,
  selectedDataset: initialDataset,
  datasetProfiles,
  onClose,
  onReportCreated,
}) => {
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(
    initialDataset?.datasetId || (datasets.length > 0 ? datasets[0].datasetId : '')
  );
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplateId>('executive_briefing');
  const [reportTitle, setReportTitle] = useState<string>('');
  const [reportSubtitle, setReportSubtitle] = useState<string>('');
  const [focusPrompt, setFocusPrompt] = useState<string>('');
  const [enabledSections, setEnabledSections] = useState<ReportSectionType[]>(
    REPORT_TEMPLATES.executive_briefing.defaultSections
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [step, setStep] = useState<'template' | 'customize'>('template');
  const [error, setError] = useState<string | null>(null);

  const currentDataset = datasets.find((d) => d.datasetId === selectedDatasetId) || initialDataset;
  const currentProfile = currentDataset ? datasetProfiles[currentDataset.datasetId] : null;

  const handleTemplateSelect = (templateId: ReportTemplateId) => {
    setSelectedTemplate(templateId);
    const def = REPORT_TEMPLATES[templateId];
    setEnabledSections(def.defaultSections);
    if (currentDataset) {
      setReportTitle(`${currentDataset.name} — ${def.name}`);
      setReportSubtitle(def.description);
    }
  };

  const handleToggleSection = (sec: ReportSectionType) => {
    if (enabledSections.includes(sec)) {
      if (enabledSections.length === 1) return; // Must have at least 1 section
      setEnabledSections(enabledSections.filter((s) => s !== sec));
    } else {
      setEnabledSections([...enabledSections, sec]);
    }
  };

  const handleGenerate = async () => {
    if (!currentDataset) {
      setError('Please select a dataset first.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const report = await generateReportFromDataset({
        userId,
        authorName: authorName || 'InsightAI Analyst',
        authorEmail,
        dataset: currentDataset,
        templateId: selectedTemplate,
        title: reportTitle || `${currentDataset.name} — ${REPORT_TEMPLATES[selectedTemplate].name}`,
        subtitle: reportSubtitle || REPORT_TEMPLATES[selectedTemplate].description,
        profile: currentProfile,
        focusPrompt,
        enabledSections,
      });

      onReportCreated(report);
    } catch (err: any) {
      console.error('Report generation error:', err);
      setError(err.message || 'Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const templateIcons: Record<string, any> = {
    Crown,
    FileText,
    AlertTriangle,
    TrendingUp,
    ShieldCheck,
    Sliders,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Build Intelligence Report</h3>
            <p className="text-xs text-slate-500">
              Generate grounded, evidence-based dossiers from verified analytics
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Dataset Selector Bar */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-indigo-600" />
            <span>Source Dataset</span>
          </label>
          <select
            value={selectedDatasetId}
            onChange={(e) => {
              setSelectedDatasetId(e.target.value);
              const ds = datasets.find((d) => d.datasetId === e.target.value);
              if (ds) {
                setReportTitle(`${ds.name} — ${REPORT_TEMPLATES[selectedTemplate].name}`);
              }
            }}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            {datasets.map((ds) => (
              <option key={ds.datasetId} value={ds.datasetId}>
                {ds.name} ({ds.rowCount?.toLocaleString() || 0} rows, {ds.fileType.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Step Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => setStep('template')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              step === 'template'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Select Template
          </button>
          <button
            type="button"
            onClick={() => setStep('customize')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              step === 'customize'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            2. Configure & Customize
          </button>
        </div>

        {step === 'template' && (
          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-700 block">
              Choose an Architecture Template
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.values(REPORT_TEMPLATES).map((tmpl) => {
                const IconComponent = templateIcons[tmpl.iconName] || FileText;
                const isSelected = selectedTemplate === tmpl.id;

                return (
                  <div
                    key={tmpl.id}
                    onClick={() => handleTemplateSelect(tmpl.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative space-y-2 text-left ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-400 shadow-sm ring-2 ring-indigo-500/10'
                        : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-900">{tmpl.name}</span>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {tmpl.description}
                    </p>
                    <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400">
                      <span className="font-semibold text-slate-600">{tmpl.badge}</span>
                      <span>•</span>
                      <span>~{tmpl.estimatedPages} pages</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setStep('customize')}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Continue to Customize</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {step === 'customize' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Report Title</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g. Q3 Sales & Revenue Intelligence Briefing"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Subtitle / Context</label>
                <input
                  type="text"
                  value={reportSubtitle}
                  onChange={(e) => setReportSubtitle(e.target.value)}
                  placeholder="e.g. Executive synthesis and variance decomposition"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Custom AI Synthesis Focus Prompt (Optional)
                </label>
                <textarea
                  value={focusPrompt}
                  onChange={(e) => setFocusPrompt(e.target.value)}
                  placeholder="e.g. Focus on margin preservation, highlight top customer segments, and explain why Q2 dipped..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Section Toggles */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-700 block">
                Include / Exclude Report Sections
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(SECTION_METADATA).map(([key, meta]) => {
                  const isIncluded = enabledSections.includes(key as any);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleToggleSection(key as any)}
                      className={`p-2.5 rounded-xl text-left border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        isIncluded
                          ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate pr-1">{meta.name}</span>
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          isIncluded ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        {isIncluded && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('template')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ← Back to Templates
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !currentDataset}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Report...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Grounded Report</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Dataset } from '../../types/dataset';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Layers,
  Clock,
  PlusCircle,
} from 'lucide-react';

interface DatasetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasets: Dataset[];
  selectedDatasetId: string | null;
  onSelectDataset: (dataset: Dataset) => void;
  onProfileDataset?: (dataset: Dataset) => void;
  onNavigateToUpload?: () => void;
}

export const DatasetSelectorModal: React.FC<DatasetSelectorModalProps> = ({
  isOpen,
  onClose,
  datasets,
  selectedDatasetId,
  onSelectDataset,
  onProfileDataset,
  onNavigateToUpload,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = datasets.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.originalFileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Select Dataset for AI Analysis</h3>
              <p className="text-xs text-slate-500">
                Choose a dataset to query with the InsightAI Data Analyst
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search datasets by name or filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Datasets List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-10">
              <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-700">No datasets found</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchTerm
                  ? 'No datasets match your search term. Try a different query.'
                  : 'Upload your first CSV or Excel file to begin analyzing.'}
              </p>
              {onNavigateToUpload && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToUpload();
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Upload Dataset</span>
                </button>
              )}
            </div>
          ) : (
            filtered.map((d) => {
              const isSelected = d.datasetId === selectedDatasetId;
              const isProfiled = d.status === 'profiled' || d.profileStatus === 'profiled';

              return (
                <div
                  key={d.datasetId}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200/80 hover:border-indigo-200 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        d.fileType === 'csv'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/70'
                          : 'bg-blue-50 text-blue-600 border border-blue-200/70'
                      }`}
                    >
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{d.name}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                          {d.fileType}
                        </span>
                        {isProfiled ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Quality: {d.qualityScore || 85}/100
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Unprofiled
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span>{d.rowCount?.toLocaleString() || 0} rows</span>
                        <span>•</span>
                        <span>{d.columnCount || 0} columns</span>
                        <span>•</span>
                        <span className="truncate">{d.originalFileName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {isProfiled ? (
                      <button
                        onClick={() => {
                          onSelectDataset(d);
                          onClose();
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700'
                        }`}
                      >
                        <span>{isSelected ? 'Active' : 'Select'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (onProfileDataset) {
                            onProfileDataset(d);
                            onClose();
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Profile First</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{datasets.length} Total Datasets</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

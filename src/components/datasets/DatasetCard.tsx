import React, { useState, useRef, useEffect } from 'react';
import { Dataset } from '../../types/dataset';
import {
  FileSpreadsheet,
  FileText,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface DatasetCardProps {
  dataset: Dataset;
  onView: (dataset: Dataset) => void;
  onRename: (dataset: Dataset) => void;
  onDelete: (dataset: Dataset) => void;
}

export const DatasetCard: React.FC<DatasetCardProps> = ({
  dataset,
  onView,
  onRename,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const isExcel = dataset.fileType === 'xlsx' || dataset.fileType === 'xls';
  const isProfiled = dataset.status === 'profiled' || Boolean(dataset.qualityScore !== undefined);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col justify-between group relative">
      
      {/* Top row */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                isExcel
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  : 'bg-blue-50 text-blue-600 border border-blue-100'
              }`}
            >
              {isExcel ? <FileSpreadsheet className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  {dataset.fileType}
                </span>
                {dataset.selectedSheet && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 truncate max-w-[90px]">
                    {dataset.selectedSheet}
                  </span>
                )}
                {isProfiled && dataset.qualityScore !== undefined ? (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      dataset.qualityScore >= 80
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : dataset.qualityScore >= 60
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    Quality: {dataset.qualityScore}/100
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200">
                    Not Profiled
                  </span>
                )}
              </div>
              <h4
                onClick={() => onView(dataset)}
                className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer line-clamp-1 mt-1"
                title={dataset.name}
              >
                {dataset.name}
              </h4>
            </div>
          </div>

          {/* Action Menu Trigger */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Dataset options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 z-30 w-40 bg-white rounded-2xl border border-slate-200 shadow-xl py-1 animate-in fade-in duration-100">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onView(dataset);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect & Profile</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onRename(dataset);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Rename</span>
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(dataset);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* File Details */}
        <p className="text-xs text-slate-400 font-medium truncate mb-3" title={dataset.originalFileName}>
          {dataset.originalFileName}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs mb-3">
          <div>
            <span className="text-[10px] text-slate-400 font-medium block">Rows</span>
            <span className="font-extrabold text-slate-800">{dataset.rowCount.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-medium block">Columns</span>
            <span className="font-extrabold text-slate-800">{dataset.columnCount}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
        <div className="flex items-center gap-1 text-slate-600 font-semibold bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          <span>{isProfiled ? 'Profiled' : 'Ready'}</span>
        </div>
        <span>{formatFileSize(dataset.fileSize)}</span>
      </div>

    </div>
  );
};

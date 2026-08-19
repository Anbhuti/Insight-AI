import React, { useState } from 'react';
import {
  DatasetPreview,
  PREVIEW_ROW_LIMIT,
} from '../../types/dataset';
import {
  FileSpreadsheet,
  FileText,
  Layers,
  CheckCircle2,
  Table as TableIcon,
  Sparkles,
  ArrowRight,
  X,
  Edit2,
} from 'lucide-react';

interface FilePreviewProps {
  preview: DatasetPreview;
  datasetName: string;
  onDatasetNameChange: (name: string) => void;
  onSheetChange?: (sheetName: string) => void;
  onConfirmUpload: () => void;
  onCancel: () => void;
  isUploading?: boolean;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  preview,
  datasetName,
  onDatasetNameChange,
  onSheetChange,
  onConfirmUpload,
  onCancel,
  isUploading = false,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isExcel = preview.fileType === 'xlsx' || preview.fileType === 'xls';
  const hasMultipleSheets = isExcel && preview.availableSheets && preview.availableSheets.length > 1;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xl space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            {isExcel ? <FileSpreadsheet className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {preview.fileType.toUpperCase()}
              </span>
              <span className="text-xs text-slate-400 font-medium">{formatFileSize(preview.fileSize)}</span>
            </div>
            
            {/* Editable Dataset Name */}
            {isEditingName ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={datasetName}
                  onChange={(e) => onDatasetNameChange(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                  autoFocus
                  className="text-base font-bold text-slate-900 border-b-2 border-indigo-600 focus:outline-none bg-slate-50 px-1 py-0.5 rounded"
                />
                <button
                  onClick={() => setIsEditingName(false)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  Done
                </button>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingName(true)}
                className="flex items-center gap-2 mt-1 cursor-pointer group"
                title="Click to edit dataset name"
              >
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {datasetName || preview.fileName}
                </h3>
                <Edit2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
            )}
            <p className="text-xs text-slate-400 truncate max-w-sm">{preview.fileName}</p>
          </div>
        </div>

        {/* Worksheet Selector for Excel */}
        {hasMultipleSheets && (
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200/80">
            <Layers className="w-4 h-4 text-slate-500 shrink-0 ml-1" />
            <div className="text-left">
              <label htmlFor="sheet-select" className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Select Worksheet
              </label>
              <select
                id="sheet-select"
                value={preview.selectedSheet || preview.availableSheets?.[0]}
                onChange={(e) => onSheetChange && onSheetChange(e.target.value)}
                disabled={isUploading}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer pr-2"
              >
                {preview.availableSheets?.map((sheet) => (
                  <option key={sheet} value={sheet}>
                    {sheet}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Dataset Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Rows</span>
          <span className="text-sm font-extrabold text-slate-900">{preview.rowCount.toLocaleString()}</span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Columns</span>
          <span className="text-sm font-extrabold text-slate-900">{preview.columnCount} detected</span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Preview Sample</span>
          <span className="text-sm font-extrabold text-slate-900">First {Math.min(PREVIEW_ROW_LIMIT, preview.sampleRows.length)} rows</span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Validation</span>
          <span className="text-sm font-extrabold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Valid Schema
          </span>
        </div>
      </div>

      {/* Preview Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-900">Preview your data</h4>
          </div>
          <span className="text-[11px] text-slate-400">Scroll horizontally to view all columns</span>
        </div>

        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
          <div className="overflow-x-auto max-h-72 scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/90 text-slate-700 font-bold sticky top-0 border-b border-slate-200 z-10">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center text-slate-400 font-mono text-[10px] border-r border-slate-200/60">
                    #
                  </th>
                  {preview.columns.map((col, idx) => (
                    <th
                      key={idx}
                      className="py-2.5 px-3 text-slate-800 font-bold text-xs whitespace-nowrap border-r border-slate-200/60 last:border-r-0"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {preview.sampleRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="py-2 px-3 text-center text-slate-400 font-mono text-[10px] bg-slate-50/50 border-r border-slate-200/60 select-none">
                      {rowIdx + 1}
                    </td>
                    {row.map((cell, colIdx) => (
                      <td
                        key={colIdx}
                        className="py-2 px-3 whitespace-nowrap border-r border-slate-200/60 last:border-r-0 max-w-[200px] truncate"
                      >
                        {cell !== null && cell !== '' ? String(cell) : (
                          <span className="text-slate-300 italic">null</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isUploading}
          className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onConfirmUpload}
          disabled={isUploading || !datasetName.trim()}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 group"
        >
          <span>Upload Dataset</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

    </div>
  );
};

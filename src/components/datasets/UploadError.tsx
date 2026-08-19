import React from 'react';
import { AlertTriangle, RefreshCw, FolderOpen, HelpCircle } from 'lucide-react';

interface UploadErrorProps {
  errorMessage: string;
  onRetry: () => void;
  onSelectAnother: () => void;
}

export const UploadError: React.FC<UploadErrorProps> = ({
  errorMessage,
  onRetry,
  onSelectAnother,
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-200/90 shadow-xl space-y-5 animate-in fade-in duration-200">
      
      {/* Icon & Heading */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-bold text-slate-900">Upload Encountered an Issue</h4>
          <p className="text-xs text-rose-700 font-medium leading-relaxed bg-rose-50/80 p-3 rounded-xl border border-rose-100/80">
            {errorMessage}
          </p>
        </div>
      </div>

      {/* Troubleshooting guide */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
          <span>Troubleshooting Tips</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-500 text-[11px]">
          <li>Ensure the file is formatted as a valid CSV, XLSX, or XLS.</li>
          <li>Check that the file size is under 25 MB.</li>
          <li>Make sure the first row contains descriptive column header names.</li>
          <li>Ensure the spreadsheet is not password protected.</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onSelectAnother}
          className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Choose another file</span>
        </button>

        <button
          type="button"
          onClick={onRetry}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry upload</span>
        </button>
      </div>

    </div>
  );
};

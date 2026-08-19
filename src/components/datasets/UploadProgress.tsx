import React from 'react';
import { UploadProgressInfo } from '../../types/dataset';
import { Loader2, X, FileSpreadsheet, Shield } from 'lucide-react';

interface UploadProgressProps {
  fileName: string;
  progress: UploadProgressInfo;
  onCancel: () => void;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  fileName,
  progress,
  onCancel,
}) => {
  const formatMB = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1);
  };

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-5 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Uploading dataset...</h4>
            <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-sm">{fileName}</p>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          title="Cancel upload"
          aria-label="Cancel upload"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-200 ease-out"
            style={{ width: `${Math.max(5, progress.percentage)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>
            {formatMB(progress.bytesTransferred)} MB / {formatMB(progress.totalBytes)} MB
          </span>
          <span className="font-bold text-indigo-600">{progress.percentage}%</span>
        </div>
      </div>

      {/* Security notice */}
      <div className="flex items-center gap-2 text-[11px] text-slate-400 border-t border-slate-100 pt-3">
        <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span>Files are securely isolated and encrypted in your dedicated storage bucket.</span>
      </div>

    </div>
  );
};

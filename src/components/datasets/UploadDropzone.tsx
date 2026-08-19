import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { ACCEPTED_EXTENSIONS } from '../../types/dataset';

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  errorMessage?: string | null;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onFileSelected,
  disabled = false,
  errorMessage,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
      // Reset input value so re-uploading the same file works
      e.target.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full space-y-3">
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label="Upload dataset dropzone. Drop your CSV or Excel file here or press Enter to browse files."
        className={`relative w-full border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-200 flex flex-col items-center justify-center cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'
            : isDragOver
            ? 'border-indigo-600 bg-indigo-50/70 scale-[1.008] shadow-lg shadow-indigo-100'
            : 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50/60 shadow-2xs'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv, .xlsx, .xls, text/csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={disabled}
        />

        {/* Upload Icon */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all ${
            isDragOver
              ? 'bg-indigo-600 text-white scale-110 shadow-md shadow-indigo-600/30'
              : 'bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:scale-105'
          }`}
        >
          <UploadCloud className="w-7 h-7" />
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
          {isDragOver ? 'Drop your file here' : 'Drop your dataset here'}
        </h3>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-slate-500 font-medium mb-3">
          or <span className="text-indigo-600 font-bold underline decoration-indigo-200 underline-offset-2">browse files</span> from your computer
        </p>

        {/* Badges / Constraints */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 text-slate-600 text-[11px] font-semibold">
          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
          <span>CSV, XLSX, XLS • Max 25 MB</span>
        </div>
      </div>
    </div>
  );
};

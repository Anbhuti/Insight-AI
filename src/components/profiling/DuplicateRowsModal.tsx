import React from 'react';
import { DuplicateRowPreview } from '../../types/dataProfile';
import { X, Copy, AlertTriangle, Layers } from 'lucide-react';

interface DuplicateRowsModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicates: DuplicateRowPreview[];
  columns: string[];
  totalDuplicates: number;
}

export const DuplicateRowsModal: React.FC<DuplicateRowsModalProps> = ({
  isOpen,
  onClose,
  duplicates,
  columns,
  totalDuplicates,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Duplicate Records Preview
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Showing sample occurrences of duplicate row entries ({totalDuplicates.toLocaleString()} total duplicates found)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Table Content */}
        <div className="p-5 sm:p-6 overflow-auto">
          {duplicates.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-medium">
              No duplicate records detected in this dataset.
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                The rows below have identical values across all columns. Review to ensure they do not unintentionally skew sum totals or averages.
              </p>

              <div className="rounded-2xl border border-slate-200 overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">First Seen Row</th>
                      <th className="py-2.5 px-3">Occurrences</th>
                      {columns.map((col, idx) => (
                        <th key={idx} className="py-2.5 px-3 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {duplicates.map((dup, idx) => (
                      <tr key={idx} className="hover:bg-amber-50/40 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          #{dup.rowIndex}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                            {dup.duplicateCount}× identical
                          </span>
                        </td>
                        {dup.values.map((cell, cIdx) => (
                          <td key={cIdx} className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px]">
                            {cell === null || cell === undefined || cell === '' ? (
                              <span className="text-slate-300 italic">null</span>
                            ) : (
                              String(cell)
                            )}
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

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Close Preview
          </button>
        </div>

      </div>
    </div>
  );
};

import React from 'react';
import { Dataset } from '../../types/dataset';
import { DatasetProfile } from '../../types/dataProfile';
import { X, Table as TableIcon, Download, FileSpreadsheet } from 'lucide-react';

interface SampleDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: Dataset | null;
  profile: DatasetProfile | null;
}

export const SampleDataModal: React.FC<SampleDataModalProps> = ({
  isOpen,
  onClose,
  dataset,
  profile,
}) => {
  if (!isOpen || !dataset) return null;

  const columns =
    dataset.previewSample?.columns ||
    profile?.columns.map((c) => c.name) ||
    [];

  const rows = dataset.previewSample?.rows || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <TableIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Sample Data: {dataset.name}
              </h3>
              <p className="text-xs text-slate-500">
                Displaying first {rows.length} rows across {columns.length} columns
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

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-4">
          {rows.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p>No preview sample available for this dataset.</p>
            </div>
          ) : (
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-2.5 px-3 w-12 text-slate-400 text-center">#</th>
                    {columns.map((col, idx) => (
                      <th key={idx} className="py-2.5 px-3.5 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40 hover:bg-indigo-50/20'}
                    >
                      <td className="py-2 px-3 text-slate-400 font-mono text-[10px] text-center">
                        {rIdx + 1}
                      </td>
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="py-2 px-3.5 text-slate-700 whitespace-nowrap max-w-[200px] truncate"
                        >
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
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            {dataset.rowCount?.toLocaleString()} total records in storage
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

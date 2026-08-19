import React from 'react';
import { RCAEvidence } from '../../services/rootCause/types';
import { X, Table, ShieldCheck, Database } from 'lucide-react';

interface SupportingDataModalProps {
  evidence: RCAEvidence | null;
  onClose: () => void;
}

export const SupportingDataModal: React.FC<SupportingDataModalProps> = ({
  evidence,
  onClose,
}) => {
  if (!evidence) return null;

  const rows = evidence.supportingDataSnippet || [];
  const columns = rows.length > 0 ? Object.keys(rows[0]).filter((k) => k !== '_originalRowIndex') : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Supporting Evidence Records
              </h3>
              <p className="text-xs text-slate-500 font-medium truncate max-w-md">
                {evidence.title} — {evidence.sampleSize} matching observations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Evidence Statement Summary */}
        <div className="px-6 py-3.5 bg-indigo-50/50 border-b border-indigo-100/60 text-xs text-indigo-900 font-medium">
          <span className="font-extrabold">Evidence Statement: </span>
          {evidence.statement}
        </div>

        {/* Table Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {rows.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    {columns.map((col) => (
                      <th key={col} className="px-3.5 py-2.5 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      {columns.map((col) => {
                        const val = row[col];
                        return (
                          <td key={col} className="px-3.5 py-2.5 whitespace-nowrap">
                            {val === null || val === undefined ? (
                              <span className="text-slate-400 italic">null</span>
                            ) : (
                              String(val)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              No direct row-level sample snippet attached for this analytical evidence.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Sample of up to {rows.length} verified records</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

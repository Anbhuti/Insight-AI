import React from 'react';
import { ColumnProfile } from '../../types/dataProfile';
import { AlertCircle, CheckCircle2, FileQuestion, HelpCircle } from 'lucide-react';

interface MissingValuesMatrixProps {
  columns: ColumnProfile[];
  totalRows: number;
  onSelectColumn: (col: ColumnProfile) => void;
}

export const MissingValuesMatrix: React.FC<MissingValuesMatrixProps> = ({
  columns,
  totalRows,
  onSelectColumn,
}) => {
  // Sort columns by missing percentage descending
  const sorted = [...columns].sort((a, b) => b.missingPercentage - a.missingPercentage);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">
          Missing Values & Completeness Breakdown
        </h3>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Detailed assessment of non-null vs missing cells across all columns.
        </p>
      </div>

      <div className="space-y-3">
        {sorted.map((col) => {
          const completePercentage = Math.round((100 - col.missingPercentage) * 10) / 10;
          return (
            <div
              key={col.name}
              onClick={() => onSelectColumn(col)}
              className="p-3 bg-slate-50/70 hover:bg-white hover:border-slate-300 border border-slate-100 rounded-xl transition-all cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{col.name}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    ({col.logicalType})
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-semibold">
                    {col.missingCount.toLocaleString()} missing ({col.missingPercentage}%)
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      col.missingPercentage === 0
                        ? 'bg-emerald-50 text-emerald-700'
                        : col.missingPercentage > 20
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {completePercentage}% Complete
                  </span>
                </div>
              </div>

              {/* Progress visual */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${completePercentage}%` }}
                  title={`${completePercentage}% present`}
                />
                <div
                  className="bg-rose-500 h-full transition-all duration-300"
                  style={{ width: `${col.missingPercentage}%` }}
                  title={`${col.missingPercentage}% missing`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

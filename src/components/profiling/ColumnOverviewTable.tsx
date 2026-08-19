import React, { useState } from 'react';
import { ColumnProfile, ColumnLogicalType } from '../../types/dataProfile';
import {
  Search,
  Filter,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  Key,
  Eye,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface ColumnOverviewTableProps {
  columns: ColumnProfile[];
  onSelectColumn: (column: ColumnProfile) => void;
}

export const ColumnOverviewTable: React.FC<ColumnOverviewTableProps> = ({
  columns,
  onSelectColumn,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'name' | 'missing' | 'unique' | 'quality'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = columns.filter((col) => {
    const matchesSearch = col.name.toLowerCase().includes(search.toLowerCase());
    const matchesType =
      typeFilter === 'all'
        ? true
        : typeFilter === 'numeric'
        ? col.logicalType === 'numeric' || col.logicalType === 'integer' || col.logicalType === 'decimal'
        : typeFilter === 'categorical'
        ? col.logicalType === 'categorical'
        : typeFilter === 'date'
        ? col.logicalType === 'date' || col.logicalType === 'datetime'
        : col.logicalType === typeFilter;

    return matchesSearch && matchesType;
  });

  const sorted = [...filtered].sort((a, b) => {
    let result = 0;
    if (sortField === 'name') {
      result = a.name.localeCompare(b.name);
    } else if (sortField === 'missing') {
      result = a.missingPercentage - b.missingPercentage;
    } else if (sortField === 'unique') {
      result = a.uniqueCount - b.uniqueCount;
    } else if (sortField === 'quality') {
      const order = { good: 1, fair: 2, poor: 3, critical: 4 };
      result = order[a.qualityRating] - order[b.qualityRating];
    }
    return sortAsc ? result : -result;
  });

  const toggleSort = (field: 'name' | 'missing' | 'unique' | 'quality') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getTypeBadge = (type: ColumnLogicalType) => {
    switch (type) {
      case 'integer':
      case 'decimal':
      case 'numeric':
        return {
          icon: <Hash className="w-3 h-3 text-blue-600" />,
          bg: 'bg-blue-50 text-blue-700 border-blue-100',
        };
      case 'date':
      case 'datetime':
        return {
          icon: <Calendar className="w-3 h-3 text-purple-600" />,
          bg: 'bg-purple-50 text-purple-700 border-purple-100',
        };
      case 'boolean':
        return {
          icon: <ToggleLeft className="w-3 h-3 text-emerald-600" />,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        };
      case 'categorical':
        return {
          icon: <Type className="w-3 h-3 text-indigo-600" />,
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        };
      default:
        return {
          icon: <Type className="w-3 h-3 text-slate-600" />,
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden space-y-3 p-4 sm:p-5">
      
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search column names..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 overflow-x-auto">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              typeFilter === 'all' ? 'bg-white text-indigo-600 shadow-2xs' : 'hover:text-slate-900'
            }`}
          >
            All Types ({columns.length})
          </button>
          <button
            onClick={() => setTypeFilter('numeric')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              typeFilter === 'numeric' ? 'bg-white text-indigo-600 shadow-2xs' : 'hover:text-slate-900'
            }`}
          >
            Numeric
          </button>
          <button
            onClick={() => setTypeFilter('categorical')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              typeFilter === 'categorical' ? 'bg-white text-indigo-600 shadow-2xs' : 'hover:text-slate-900'
            }`}
          >
            Categorical
          </button>
          <button
            onClick={() => setTypeFilter('date')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              typeFilter === 'date' ? 'bg-white text-indigo-600 shadow-2xs' : 'hover:text-slate-900'
            }`}
          >
            Date
          </button>
          <button
            onClick={() => setTypeFilter('text')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              typeFilter === 'text' ? 'bg-white text-indigo-600 shadow-2xs' : 'hover:text-slate-900'
            }`}
          >
            Text
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200/80 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th
                onClick={() => toggleSort('name')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Column Name</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Logical Type</th>
              <th
                onClick={() => toggleSort('missing')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Missing Rate</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('unique')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Distinct Values</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Distribution / Outliers</th>
              <th
                onClick={() => toggleSort('quality')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Health</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {sorted.map((col) => {
              const typeBadge = getTypeBadge(col.logicalType);
              const isNumeric =
                col.logicalType === 'numeric' ||
                col.logicalType === 'integer' ||
                col.logicalType === 'decimal';

              return (
                <tr
                  key={col.name}
                  onClick={() => onSelectColumn(col)}
                  className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                >
                  {/* Column Name */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {col.name}
                      </span>
                      {col.isPotentialId && (
                        <span
                          className="p-1 rounded bg-indigo-50 text-indigo-600 text-[10px]"
                          title="Potential Unique Identifier"
                        >
                          <Key className="w-3 h-3" />
                        </span>
                      )}
                      {col.isConstant && (
                        <span
                          className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[9px]"
                          title="Uniform/Constant values"
                        >
                          Const
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${typeBadge.bg}`}
                    >
                      {typeBadge.icon}
                      <span>{col.logicalType}</span>
                    </span>
                  </td>

                  {/* Missing */}
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[11px] font-semibold">
                        <span>{col.missingPercentage}%</span>
                        <span className="text-slate-400 text-[10px] font-normal">
                          ({col.missingCount.toLocaleString()})
                        </span>
                      </div>
                      <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            col.missingPercentage === 0
                              ? 'bg-emerald-500'
                              : col.missingPercentage > 20
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.max(4, col.missingPercentage)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Distinct */}
                  <td className="py-3 px-4">
                    <div className="text-xs">
                      <span className="font-bold text-slate-800">
                        {col.uniqueCount.toLocaleString()}
                      </span>
                      <span className="text-slate-400 text-[10px] block">
                        {col.uniquePercentage}% unique
                      </span>
                    </div>
                  </td>

                  {/* Distribution / Outliers */}
                  <td className="py-3 px-4">
                    {isNumeric && col.numericStats ? (
                      col.numericStats.outlierCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <AlertTriangle className="w-3 h-3" />
                          <span>
                            {col.numericStats.outlierCount} outliers ({col.numericStats.outlierPercentage}%)
                          </span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          Range: [{col.numericStats.min} to {col.numericStats.max}]
                        </span>
                      )
                    ) : col.logicalType === 'categorical' && col.categoricalStats ? (
                      <span className="text-[11px] text-slate-500 truncate max-w-[150px] block">
                        Top: {col.categoricalStats.topValues[0]?.value || 'N/A'}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">—</span>
                    )}
                  </td>

                  {/* Health */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block text-[10px] font-bold capitalize px-2 py-0.5 rounded-full ${
                        col.qualityRating === 'good'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : col.qualityRating === 'fair'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {col.qualityRating}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectColumn(col);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};

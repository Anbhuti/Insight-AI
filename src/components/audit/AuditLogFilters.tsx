import React from 'react';
import { AuditCategory, AuditEventStatus, AuditFilterParams } from '../../services/audit/auditTypes';
import { AUDIT_CATEGORIES } from '../../services/audit/auditConstants';
import {
  Search,
  Filter,
  Calendar,
  X,
  RotateCcw,
  RefreshCw,
  Shield,
  Bot,
  Database,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';

interface AuditLogFiltersProps {
  filters: AuditFilterParams;
  onFilterChange: (newFilters: Partial<AuditFilterParams>) => void;
  onResetFilters: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  activePreset: string;
  onSelectPreset: (presetId: string) => void;
}

export const AuditLogFilters: React.FC<AuditLogFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  onRefresh,
  isLoading,
  activePreset,
  onSelectPreset,
}) => {
  const presets = [
    { id: 'all', label: 'All Activities', icon: null },
    { id: 'security', label: 'Security & Policy', icon: Shield },
    { id: 'sql', label: 'SQL Operations', icon: Database },
    { id: 'ai', label: 'AI Analyst', icon: Bot },
    { id: 'datasets', label: 'Datasets & Profiling', icon: FileSpreadsheet },
    { id: 'governance', label: 'Reports & Alerts', icon: FileText },
  ];

  const hasActiveFilters = Boolean(
    filters.searchQuery ||
      (filters.category && filters.category !== 'ALL') ||
      (filters.status && filters.status !== 'ALL') ||
      (filters.dateRange && filters.dateRange !== 'all')
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 mb-4 shadow-xs space-y-3">
      {/* Top Row: Presets and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Preset Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {presets.map((p) => {
            const Icon = p.icon;
            const isSelected = activePreset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPreset(p.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Right Actions: Refresh and Reset */}
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh logs from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Bottom Row: Detailed Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
        {/* Search Input */}
        <div className="lg:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by action, actor, resource, audit ID, or request ID..."
            value={filters.searchQuery || ''}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value, page: 1 })}
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50/60 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white placeholder-slate-400"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ searchQuery: '', page: 1 })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Date Range Selector */}
        <div className="lg:col-span-3">
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filters.dateRange || 'all'}
              onChange={(e) => onFilterChange({ dateRange: e.target.value as any, page: 1 })}
              className="w-full pl-8.5 pr-8 py-2 text-xs bg-slate-50/60 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer text-slate-700"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>

        {/* Category Selector */}
        <div className="lg:col-span-2">
          <select
            value={filters.category || 'ALL'}
            onChange={(e) => onFilterChange({ category: e.target.value as any, page: 1 })}
            className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer text-slate-700"
          >
            <option value="ALL">All Categories</option>
            {AUDIT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status Selector */}
        <div className="lg:col-span-2">
          <select
            value={filters.status || 'ALL'}
            onChange={(e) => onFilterChange({ status: e.target.value as any, page: 1 })}
            className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success Only</option>
            <option value="FAILURE">Failures Only</option>
            <option value="BLOCKED">Blocked by Policy</option>
          </select>
        </div>
      </div>
    </div>
  );
};

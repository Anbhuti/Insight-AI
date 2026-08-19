import React, { useState } from 'react';
import { Dataset } from '../../types/dataset';
import { DatasetCard } from './DatasetCard';
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  Database,
  Plus,
  FileSpreadsheet,
  FileText,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Filter,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';

interface DatasetListProps {
  datasets: Dataset[];
  isLoading: boolean;
  onView: (dataset: Dataset) => void;
  onRename: (dataset: Dataset) => void;
  onDelete: (dataset: Dataset) => void;
  onUploadClick: () => void;
}

export const DatasetList: React.FC<DatasetListProps> = ({
  datasets,
  isLoading,
  onView,
  onRename,
  onDelete,
  onUploadClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'csv' | 'excel' | 'profiled' | 'unprofiled'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'quality' | 'rows'>('recent');

  const filteredDatasets = datasets
    .filter((ds) => {
      const matchesSearch =
        ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ds.originalFileName.toLowerCase().includes(searchQuery.toLowerCase());

      const isExcel = ds.fileType === 'xlsx' || ds.fileType === 'xls';
      const isProfiled = ds.status === 'profiled' || Boolean(ds.qualityScore !== undefined);

      let matchesFilter = true;
      if (filterType === 'csv') matchesFilter = ds.fileType === 'csv';
      else if (filterType === 'excel') matchesFilter = isExcel;
      else if (filterType === 'profiled') matchesFilter = isProfiled;
      else if (filterType === 'unprofiled') matchesFilter = !isProfiled;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'quality') return (b.qualityScore || 0) - (a.qualityScore || 0);
      if (sortBy === 'rows') return b.rowCount - a.rowCount;
      return 0; // Default recent
    });

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-5">
      
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search datasets by name or file..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Format & Profiling Filter */}
          <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 overflow-x-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                filterType === 'all' ? 'bg-white text-indigo-600 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              All ({datasets.length})
            </button>
            <button
              onClick={() => setFilterType('profiled')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                filterType === 'profiled' ? 'bg-white text-indigo-600 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Profiled
            </button>
            <button
              onClick={() => setFilterType('csv')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                filterType === 'csv' ? 'bg-white text-indigo-600 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              CSV
            </button>
            <button
              onClick={() => setFilterType('excel')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                filterType === 'excel' ? 'bg-white text-indigo-600 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Excel
            </button>
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="recent">Sort: Most Recent</option>
            <option value="quality">Sort: Quality Score</option>
            <option value="rows">Sort: Row Count</option>
            <option value="name">Sort: Name (A-Z)</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 text-slate-500">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-2xs' : 'hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-indigo-600 shadow-2xs' : 'hover:text-slate-900'
              }`}
              title="Table View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-44 bg-slate-100 rounded-2xl animate-pulse border border-slate-200/60"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredDatasets.length === 0 && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 text-center space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
            <Database className="w-7 h-7" />
          </div>

          <div className="max-w-sm mx-auto space-y-1">
            <h4 className="text-base font-bold text-slate-900">
              {searchQuery ? 'No datasets match your search' : 'No datasets registered yet'}
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              {searchQuery
                ? 'Try searching with another keyword or resetting the filter.'
                : 'Upload your CSV or Excel spreadsheets to begin inspecting, profiling, and analyzing.'}
            </p>
          </div>

          <div>
            {searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={onUploadClick}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Upload First Dataset</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Dataset Grid View */}
      {!isLoading && filteredDatasets.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDatasets.map((ds) => (
            <DatasetCard
              key={ds.datasetId}
              dataset={ds}
              onView={onView}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Dataset Table View */}
      {!isLoading && filteredDatasets.length > 0 && viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Dataset</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Rows</th>
                  <th className="py-3 px-4">Columns</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Quality Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredDatasets.map((ds) => {
                  const isExcel = ds.fileType === 'xlsx' || ds.fileType === 'xls';
                  const isProfiled = ds.status === 'profiled' || Boolean(ds.qualityScore !== undefined);

                  return (
                    <tr key={ds.datasetId} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isExcel
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                : 'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}
                          >
                            {isExcel ? <FileSpreadsheet className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          </div>
                          <div>
                            <button
                              onClick={() => onView(ds)}
                              className="font-bold text-slate-900 hover:text-indigo-600 text-left transition-colors cursor-pointer line-clamp-1"
                            >
                              {ds.name}
                            </button>
                            <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                              {ds.originalFileName}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {ds.fileType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold">{ds.rowCount.toLocaleString()}</td>
                      <td className="py-3 px-4">{ds.columnCount}</td>
                      <td className="py-3 px-4 text-slate-500">{formatFileSize(ds.fileSize)}</td>
                      <td className="py-3 px-4">
                        {isProfiled && ds.qualityScore !== undefined ? (
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              ds.qualityScore >= 80
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : ds.qualityScore >= 60
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {ds.qualityScore}/100
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isProfiled
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                              : 'text-slate-600 bg-slate-100 border-slate-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>{isProfiled ? 'Profiled' : 'Ready'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onView(ds)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Inspect & Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onRename(ds)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Rename"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(ds)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

import React from 'react';
import { AuditEvent, AuditEventStatus } from '../../services/audit/auditTypes';
import { getStatusBadgeClasses } from '../../services/audit/auditFormatter';
import {
  ShieldAlert,
  ShieldCheck,
  Ban,
  Clock,
  Eye,
  User as UserIcon,
  Bot,
  Database,
  FileSpreadsheet,
  FileText,
  Bell,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface AuditLogTableProps {
  events: AuditEvent[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
  onSelectEvent: (event: AuditEvent) => void;
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({
  events,
  totalCount,
  currentPage,
  pageSize,
  totalPages,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onSelectEvent,
}) => {
  const formatTimeAgo = (isoString: string): string => {
    try {
      const diff = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days}d ago`;
      return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return isoString;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Authentication':
      case 'Security':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />;
      case 'SQL Agent':
        return <Database className="w-3.5 h-3.5 text-indigo-500" />;
      case 'AI Analyst':
        return <Bot className="w-3.5 h-3.5 text-purple-500" />;
      case 'Datasets':
      case 'Data Quality':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />;
      case 'Reports':
        return <FileText className="w-3.5 h-3.5 text-emerald-500" />;
      case 'Alerts':
        return <Bell className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <UserIcon className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const renderStatusBadge = (status: AuditEventStatus) => {
    const classes = getStatusBadgeClasses(status);
    let Icon = ShieldCheck;
    if (status === 'FAILURE') Icon = AlertTriangle;
    if (status === 'BLOCKED') Icon = Ban;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-semibold uppercase tracking-wider border ${classes.bg} ${classes.text} ${classes.border}`}
      >
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const renderActorBadge = (event: AuditEvent) => {
    const isSystem = event.actorType === 'SYSTEM';
    const email = event.actorEmail || (isSystem ? 'System Engine' : event.actorUserId);
    const shortName = email.split('@')[0];

    return (
      <div className="flex items-center gap-2 max-w-[200px]">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
            isSystem ? 'bg-slate-100 text-slate-600' : 'bg-indigo-100 text-indigo-700'
          }`}
        >
          {isSystem ? 'SYS' : shortName.substring(0, 2).toUpperCase()}
        </div>
        <div className="truncate">
          <div className="text-xs font-medium text-slate-900 truncate" title={email}>
            {shortName}
          </div>
          <div className="text-2xs text-slate-400 capitalize flex items-center gap-1">
            {event.actorRole || (isSystem ? 'System' : 'Member')}
          </div>
        </div>
      </div>
    );
  };

  const startRecord = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-2xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Action & Category</th>
              <th className="py-3 px-4">Target Resource</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Event Summary</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-500">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span>Loading audit records...</span>
                  </div>
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-500">
                  <div className="max-w-sm mx-auto space-y-2">
                    <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-medium text-slate-700">No audit events match your filter</p>
                    <p className="text-xs text-slate-400">
                      Try clearing search parameters or adjusting date range bounds.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr
                  key={event.auditId}
                  onClick={() => onSelectEvent(event)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* Timestamp */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="text-xs font-medium text-slate-900" title={event.timestamp}>
                      {formatTimeAgo(event.timestamp)}
                    </div>
                    <div className="text-2xs text-slate-400 font-mono">
                      {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </td>

                  {/* Actor */}
                  <td className="py-3 px-4 whitespace-nowrap">{renderActorBadge(event)}</td>

                  {/* Action & Category */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {getCategoryIcon(event.category)}
                      <span className="font-mono font-medium text-slate-800 text-xs">{event.action}</span>
                    </div>
                    <div className="text-2xs text-slate-400 pl-5">{event.category}</div>
                  </td>

                  {/* Target Resource */}
                  <td className="py-3 px-4 whitespace-nowrap max-w-[200px]">
                    <div className="text-xs font-medium text-slate-800 truncate" title={event.resourceName || event.resourceId}>
                      {event.resourceName || event.resourceId}
                    </div>
                    <div className="text-2xs text-slate-400 font-mono">{event.resourceType}</div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 whitespace-nowrap">{renderStatusBadge(event.status)}</td>

                  {/* Summary */}
                  <td className="py-3 px-4 max-w-xs">
                    <p className="text-xs text-slate-600 truncate" title={event.description}>
                      {event.description}
                    </p>
                  </td>

                  {/* Action Button */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(event);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-2xs font-medium text-slate-600 group-hover:text-indigo-600 bg-slate-50 group-hover:bg-indigo-50 border border-slate-200 group-hover:border-indigo-200 rounded-md transition-colors cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        {/* Counter */}
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-slate-900">{startRecord}</strong> - <strong className="text-slate-900">{endRecord}</strong> of{' '}
            <strong className="text-slate-900">{totalCount}</strong> audit events
          </span>
        </div>

        {/* Page Size & Navigation Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
              className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-slate-600"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 py-1 text-xs font-medium text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
              className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-slate-600"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

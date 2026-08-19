import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { AuditService } from '../../services/audit/auditService';
import {
  AuditEvent,
  AuditFilterParams,
  AuditSummary,
  AuditIntegrityResult,
} from '../../services/audit/auditTypes';
import { AuditSummaryCards } from './AuditSummaryCards';
import { AuditLogFilters } from './AuditLogFilters';
import { AuditLogTable } from './AuditLogTable';
import { AuditDetailDrawer } from './AuditDetailDrawer';
import { AuditExportModal } from './AuditExportModal';
import { AuditIntegrityModal } from './AuditIntegrityModal';
import {
  ShieldCheck,
  ShieldAlert,
  Download,
  Lock,
  FileSpreadsheet,
  RefreshCw,
  Layers,
  Sparkles,
} from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { user } = useAuth();
  const { currentOrganization, effectiveRole, hasPermission } = useWorkspace();

  const orgId = currentOrganization?.id || 'org_default';
  const canView = hasPermission('audit:view');
  const canSearch = hasPermission('audit:search');
  const canExport = hasPermission('audit:export');

  // State
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [integrity, setIntegrity] = useState<AuditIntegrityResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Modals & Drawers
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isIntegrityOpen, setIsIntegrityOpen] = useState(false);

  // Filters
  const [activePreset, setActivePreset] = useState('all');
  const [filters, setFilters] = useState<AuditFilterParams>({
    organizationId: orgId,
    category: 'ALL',
    status: 'ALL',
    dateRange: 'all',
    searchQuery: '',
    page: 1,
    pageSize: 25,
  });

  // Seed baseline logs on first load if empty
  useEffect(() => {
    if (!user || !orgId) return;
    AuditService.seedInitialAuditLogsIfEmpty(orgId, user.uid, user.email || undefined).then(() => {
      loadAuditLogs();
      loadSummaryAndIntegrity();
    });
  }, [orgId, user]);

  const loadAuditLogs = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    try {
      const response = await AuditService.getAuditLogs({
        ...filters,
        organizationId: orgId,
      });
      setEvents(response.events);
      setTotalCount(response.totalCount);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, orgId]);

  const loadSummaryAndIntegrity = useCallback(async () => {
    if (!orgId) return;
    try {
      const [sum, integ] = await Promise.all([
        AuditService.getAuditSummary(orgId),
        AuditService.verifyAuditIntegrity(orgId),
      ]);
      setSummary(sum);
      setIntegrity(integ);
    } catch (err) {
      console.error('Failed to load audit summary:', err);
    }
  }, [orgId]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const handleFilterChange = (newFilters: Partial<AuditFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setActivePreset('all');
    setFilters({
      organizationId: orgId,
      category: 'ALL',
      status: 'ALL',
      dateRange: 'all',
      searchQuery: '',
      page: 1,
      pageSize: 25,
    });
  };

  const handleSelectPreset = (presetId: string) => {
    setActivePreset(presetId);
    let newCategory: any = 'ALL';
    let newStatus: any = 'ALL';

    switch (presetId) {
      case 'security':
        newCategory = 'Security';
        break;
      case 'sql':
        newCategory = 'SQL Agent';
        break;
      case 'ai':
        newCategory = 'AI Analyst';
        break;
      case 'datasets':
        newCategory = 'Datasets';
        break;
      case 'governance':
        newCategory = 'Reports';
        break;
      case 'all':
      default:
        newCategory = 'ALL';
        newStatus = 'ALL';
        break;
    }

    setFilters((prev) => ({
      ...prev,
      category: newCategory,
      status: newStatus,
      page: 1,
    }));
  };

  const handleVerifyIntegrity = async () => {
    setIsVerifying(true);
    try {
      const res = await AuditService.verifyAuditIntegrity(orgId);
      setIntegrity(res);
      setIsIntegrityOpen(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOpenDetail = (event: AuditEvent) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  if (!canView) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto my-12 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted: Audit Logs</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Your current role (<strong className="capitalize">{effectiveRole}</strong>) does not have
          permission to view the organization-level audit log ledger. Please request administrative access
          from your workspace owner.
        </p>
        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 border border-slate-200">
          Required Permission: <code className="text-indigo-600 font-bold">audit:view</code>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Security & Audit Logs</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              SOC2 & ISO 27001 Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Server-enforced, immutable audit trail with cryptographic SHA-256 hash chaining
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleVerifyIntegrity}
            disabled={isVerifying}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            {isVerifying ? 'Verifying...' : 'Verify Chain Integrity'}
          </button>

          <button
            onClick={() => setIsExportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Compliance Logs
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <AuditSummaryCards
        summary={summary}
        integrity={integrity}
        isVerifying={isVerifying}
        onVerifyIntegrity={handleVerifyIntegrity}
      />

      {/* Filter and Search Bar */}
      <AuditLogFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onRefresh={() => {
          loadAuditLogs();
          loadSummaryAndIntegrity();
        }}
        isLoading={isLoading}
        activePreset={activePreset}
        onSelectPreset={handleSelectPreset}
      />

      {/* Audit Log Data Table */}
      <AuditLogTable
        events={events}
        totalCount={totalCount}
        currentPage={filters.page || 1}
        pageSize={filters.pageSize || 25}
        totalPages={totalPages}
        isLoading={isLoading}
        onPageChange={(p) => handleFilterChange({ page: p })}
        onPageSizeChange={(sz) => handleFilterChange({ pageSize: sz, page: 1 })}
        onSelectEvent={handleOpenDetail}
      />

      {/* Detail Drawer */}
      <AuditDetailDrawer
        event={selectedEvent}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedEvent(null);
        }}
      />

      {/* Export Modal */}
      <AuditExportModal
        isOpen={isExportOpen}
        onClose={() => {
          setIsExportOpen(false);
          loadAuditLogs(); // Refresh in case export logged new event
          loadSummaryAndIntegrity();
        }}
        organizationId={orgId}
        actorUserId={user?.uid || 'user_analyst'}
        actorEmail={user?.email || undefined}
        currentFilters={filters}
        totalFilteredCount={totalCount}
        canExport={canExport}
      />

      {/* Integrity Verification Modal */}
      <AuditIntegrityModal
        isOpen={isIntegrityOpen}
        onClose={() => setIsIntegrityOpen(false)}
        integrity={integrity}
        isVerifying={isVerifying}
        onRunVerification={handleVerifyIntegrity}
        organizationId={orgId}
      />
    </div>
  );
};

import React from 'react';
import { AuditSummary, AuditIntegrityResult } from '../../services/audit/auditTypes';
import {
  ShieldAlert,
  ShieldCheck,
  Ban,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Lock,
  RefreshCw,
} from 'lucide-react';

interface AuditSummaryCardsProps {
  summary: AuditSummary | null;
  integrity: AuditIntegrityResult | null;
  isVerifying: boolean;
  onVerifyIntegrity: () => void;
}

export const AuditSummaryCards: React.FC<AuditSummaryCardsProps> = ({
  summary,
  integrity,
  isVerifying,
  onVerifyIntegrity,
}) => {
  const totalEvents = summary?.totalEvents ?? 0;
  const securityEvents = summary?.securityEvents ?? 0;
  const blockedActions = summary?.blockedActions ?? 0;
  const failedActions = summary?.failedActions ?? 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Audit Events Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs transition-all hover:shadow-md hover:border-slate-300">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Audit Events</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">{totalEvents.toLocaleString()}</span>
          <span className="text-xs font-medium text-slate-500">recorded</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">Append-only audit ledger across all tenant activities</p>
      </div>

      {/* Security Incidents Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs transition-all hover:shadow-md hover:border-slate-300">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Security & Policy</span>
          <div className={`w-8 h-8 rounded-lg ${securityEvents > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'} flex items-center justify-center`}>
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold ${securityEvents > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {securityEvents.toLocaleString()}
          </span>
          <span className="text-xs font-medium text-slate-500">events</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">Auth failures, blocked statements, and permission violations</p>
      </div>

      {/* Blocked Actions Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs transition-all hover:shadow-md hover:border-slate-300">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Blocked Actions</span>
          <div className={`w-8 h-8 rounded-lg ${blockedActions > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'} flex items-center justify-center`}>
            <Ban className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold ${blockedActions > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {blockedActions.toLocaleString()}
          </span>
          <span className="text-xs font-medium text-slate-500">prevented</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">Zero-trust AST guards and server authorization blocks</p>
      </div>

      {/* Cryptographic Chain Integrity Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs transition-all hover:shadow-md hover:border-slate-300 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Chain Integrity</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {integrity?.isValid ? (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Intact
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3.5 h-3.5" /> Verification Needed
              </span>
            )}
            <span className="text-xs text-slate-500">SHA-256</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {integrity ? `${integrity.totalVerified} verified` : 'Ready to verify'}
          </span>
          <button
            onClick={onVerifyIntegrity}
            disabled={isVerifying}
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
            {isVerifying ? 'Verifying...' : 'Verify Chain'}
          </button>
        </div>
      </div>
    </div>
  );
};

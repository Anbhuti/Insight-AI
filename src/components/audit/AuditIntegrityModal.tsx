import React, { useState } from 'react';
import { AuditIntegrityResult } from '../../services/audit/auditTypes';
import {
  Lock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  ShieldCheck,
  Hash,
  Layers,
} from 'lucide-react';

interface AuditIntegrityModalProps {
  isOpen: boolean;
  onClose: () => void;
  integrity: AuditIntegrityResult | null;
  isVerifying: boolean;
  onRunVerification: () => void;
  organizationId: string;
}

export const AuditIntegrityModal: React.FC<AuditIntegrityModalProps> = ({
  isOpen,
  onClose,
  integrity,
  isVerifying,
  onRunVerification,
  organizationId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Cryptographic Chain Verification</h3>
            <p className="text-xs text-slate-500">
              Audit log immutability and tamper-detection validator
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Status Display Card */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3.5 ${
              integrity?.isValid
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}
          >
            {integrity?.isValid ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <span className="font-bold text-sm block">
                {integrity?.isValid ? 'Audit Ledger Verified 100% Intact' : 'Tamper Alert Detected'}
              </span>
              <p className="leading-relaxed text-xs opacity-90">
                {integrity?.isValid
                  ? `Successfully validated all ${integrity.totalVerified} chained records from Genesis root to current event. No records have been modified, backdated, or removed.`
                  : `Discrepancy detected at record index ${integrity?.tamperedIndex}. The computed SHA-256 hash failed to match expected chain signature.`}
              </p>
            </div>
          </div>

          {/* Technical Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
            <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-500">
              Chain Security Specifications
            </h4>
            <div className="grid grid-cols-2 gap-2 text-2xs font-mono">
              <div>
                <span className="text-slate-400 block">Organization Scope:</span>
                <span className="text-slate-800 font-semibold">{organizationId}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Algorithm:</span>
                <span className="text-slate-800 font-semibold">SHA-256 Chained Hashes</span>
              </div>
              <div>
                <span className="text-slate-400 block">Genesis Block:</span>
                <span className="text-slate-800 font-semibold">GENESIS_INSIGHT_AI_ROOT_0</span>
              </div>
              <div>
                <span className="text-slate-400 block">Last Verified:</span>
                <span className="text-slate-800 font-semibold">
                  {integrity ? new Date(integrity.verifiedAt).toLocaleTimeString() : 'Never'}
                </span>
              </div>
            </div>
          </div>

          {/* Re-verify Button */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-2xs text-slate-400">SOC2 CC6.1 & ISO 27001 Compliant</span>
            <button
              onClick={onRunVerification}
              disabled={isVerifying}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              {isVerifying ? 'Verifying Hash Chain...' : 'Re-verify Entire Chain'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

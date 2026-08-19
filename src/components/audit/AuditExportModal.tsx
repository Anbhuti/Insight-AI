import React, { useState } from 'react';
import { AuditFilterParams } from '../../services/audit/auditTypes';
import { AuditService } from '../../services/audit/auditService';
import {
  Download,
  FileSpreadsheet,
  FileCode,
  X,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface AuditExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  actorUserId: string;
  actorEmail?: string;
  currentFilters: AuditFilterParams;
  totalFilteredCount: number;
  canExport: boolean;
}

export const AuditExportModal: React.FC<AuditExportModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  actorUserId,
  actorEmail,
  currentFilters,
  totalFilteredCount,
  canExport,
}) => {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [scope, setScope] = useState<'filtered' | 'all'>('filtered');
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [exportedFilename, setExportedFilename] = useState('');

  if (!isOpen) return null;

  const handleExport = async () => {
    if (!canExport) return;
    setIsExporting(true);
    try {
      const filtersToApply = scope === 'filtered' ? currentFilters : { organizationId };
      const result = await AuditService.exportAuditLogs(
        organizationId,
        format,
        actorUserId,
        actorEmail,
        filtersToApply
      );

      // Trigger browser download
      const blob = new Blob([result.content], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', result.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportedFilename(result.filename);
      setExportComplete(true);
    } catch (err) {
      console.error('Audit export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Export Audit Log Records</h3>
            <p className="text-xs text-slate-500">
              Download cryptographic compliance records for SOC2 / ISO audits
            </p>
          </div>
        </div>

        {!canExport ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-xs text-amber-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <Lock className="w-4 h-4" /> Administrative Authorization Required
            </div>
            <p>
              Your current role does not possess the <code>audit:export</code> permission. Only Workspace
              Owners and Organization Admins can extract raw audit logs.
            </p>
          </div>
        ) : exportComplete ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Export Successfully Generated!</h4>
            <p className="text-xs text-slate-600 font-mono bg-slate-50 p-2 rounded-lg border border-slate-200 break-all">
              {exportedFilename}
            </p>
            <p className="text-xs text-slate-500">
              The compliance export has been verified and logged in the append-only audit trail.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Format Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">Export Format</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormat('csv')}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    format === 'csv'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <FileSpreadsheet
                    className={`w-5 h-5 ${format === 'csv' ? 'text-indigo-600' : 'text-slate-400'}`}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">CSV Document</div>
                    <div className="text-2xs text-slate-500">For Excel, BI, and auditors</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('json')}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    format === 'json'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <FileCode
                    className={`w-5 h-5 ${format === 'json' ? 'text-indigo-600' : 'text-slate-400'}`}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">JSON Archive</div>
                    <div className="text-2xs text-slate-500">With SHA-256 signatures</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Scope Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">Scope of Records</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="scope"
                    checked={scope === 'filtered'}
                    onChange={() => setScope('filtered')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-800 font-medium">
                    Current Filtered Results ({totalFilteredCount} matching records)
                  </span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="scope"
                    checked={scope === 'all'}
                    onChange={() => setScope('all')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-800 font-medium">
                    Full Organization History (Complete append-only ledger)
                  </span>
                </label>
              </div>
            </div>

            {/* Compliance Guarantee Notice */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-2xs text-slate-600 space-y-1">
              <span className="font-semibold text-slate-800 block">Tamper Verification Notice:</span>
              <p>
                All exported records contain chained SHA-256 hashes verifying that entries have not been
                retroactively altered or deleted.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
                {isExporting ? 'Generating Export...' : `Download ${format.toUpperCase()}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

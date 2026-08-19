import React, { useState } from 'react';
import { AuditEvent } from '../../services/audit/auditTypes';
import { getStatusBadgeClasses } from '../../services/audit/auditFormatter';
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  Ban,
  AlertTriangle,
  Lock,
  Terminal,
  Clock,
  User,
  Layers,
  FileCode,
  Hash,
  Globe,
} from 'lucide-react';

interface AuditDetailDrawerProps {
  event: AuditEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditDetailDrawer: React.FC<AuditDetailDrawerProps> = ({ event, isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const statusClasses = getStatusBadgeClasses(event.status);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end transition-opacity">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Audit Record Inspection</h3>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-semibold uppercase tracking-wider border ${statusClasses.bg} ${statusClasses.text} ${statusClasses.border}`}
                >
                  {event.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">{event.auditId}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Executive Event Summary */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Event Description
            </span>
            <p className="text-sm font-medium text-slate-900 leading-relaxed">{event.description}</p>
          </div>

          {/* Primary Attributes Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            {/* Action */}
            <div className="bg-white p-3 rounded-lg border border-slate-200/80">
              <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Action Name
              </span>
              <span className="font-mono font-semibold text-slate-900">{event.action}</span>
            </div>

            {/* Category */}
            <div className="bg-white p-3 rounded-lg border border-slate-200/80">
              <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Category
              </span>
              <span className="font-medium text-slate-800">{event.category}</span>
            </div>

            {/* Actor Email / ID */}
            <div className="bg-white p-3 rounded-lg border border-slate-200/80">
              <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Actor User
              </span>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-900 truncate mr-2" title={event.actorEmail || event.actorUserId}>
                  {event.actorEmail || event.actorUserId}
                </span>
                <span className="text-2xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded capitalize">
                  {event.actorRole || event.actorType.toLowerCase()}
                </span>
              </div>
            </div>

            {/* Timestamp */}
            <div className="bg-white p-3 rounded-lg border border-slate-200/80">
              <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Server Timestamp (UTC)
              </span>
              <span className="font-mono text-slate-700">{event.timestamp}</span>
            </div>

            {/* Resource */}
            <div className="bg-white p-3 rounded-lg border border-slate-200/80">
              <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Target Resource
              </span>
              <div className="font-medium text-slate-900 truncate">
                {event.resourceName || event.resourceId}
              </div>
              <span className="text-2xs text-slate-400 font-mono uppercase">{event.resourceType}</span>
            </div>

            {/* Request ID */}
            <div className="bg-white p-3 rounded-lg border border-slate-200/80">
              <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Correlation Request ID
              </span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-slate-700 truncate">{event.requestId || 'N/A'}</span>
                {event.requestId && (
                  <button
                    onClick={() => handleCopy(event.requestId!, 'reqId')}
                    className="text-slate-400 hover:text-slate-600 ml-1 cursor-pointer"
                  >
                    {copiedKey === 'reqId' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Client & Network Context */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
            <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" /> Client Environment & Request Origin
            </h4>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <span className="text-slate-400 text-2xs block">IP Address</span>
                <span className="font-mono text-slate-800">{event.ipAddress || '127.0.0.1'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-2xs block">Client User Agent</span>
                <span className="text-slate-700 truncate block text-2xs" title={event.userAgent}>
                  {event.userAgent || 'Web Browser'}
                </span>
              </div>
            </div>
          </div>

          {/* Cryptographic Tamper-Evident Chain */}
          <div className="bg-slate-900 rounded-xl p-4 text-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> Cryptographic Integrity Proof
              </h4>
              <span className="text-2xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
                SHA-256 Chained
              </span>
            </div>

            <div className="space-y-2 text-2xs font-mono">
              <div>
                <span className="text-slate-400 block mb-0.5">Previous Block Hash:</span>
                <div className="bg-slate-800/80 p-2 rounded text-slate-300 break-all select-all">
                  {event.previousHash || 'GENESIS_INSIGHT_AI_ROOT_0'}
                </div>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Event Hash:</span>
                <div className="bg-slate-800/80 p-2 rounded text-emerald-300 break-all select-all flex items-center justify-between">
                  <span>{event.hash || 'sha256_uncalculated'}</span>
                  {event.hash && (
                    <button
                      onClick={() => handleCopy(event.hash!, 'hash')}
                      className="text-slate-400 hover:text-white ml-2 cursor-pointer"
                    >
                      {copiedKey === 'hash' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sanitized Structured Metadata Inspector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-indigo-600" /> Sanitized Structured Metadata
              </h4>
              <button
                onClick={() => handleCopy(JSON.stringify(event.metadata || {}, null, 2), 'meta')}
                className="inline-flex items-center gap-1 text-2xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              >
                {copiedKey === 'meta' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" /> Copied JSON
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy JSON
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto text-2xs font-mono text-slate-200 max-h-60 border border-slate-800">
              <pre>{JSON.stringify(event.metadata || {}, null, 2)}</pre>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => handleCopy(JSON.stringify(event, null, 2), 'fullEvent')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            {copiedKey === 'fullEvent' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedKey === 'fullEvent' ? 'Copied Full Audit Record' : 'Copy Raw Audit Record'}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

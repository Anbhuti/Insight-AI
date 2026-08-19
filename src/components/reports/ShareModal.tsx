import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Globe,
  Clock,
  ShieldAlert,
  Eye,
  Link,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Report } from '../../services/reports/reportTypes';
import {
  createShareLink,
  revokeShareLink,
} from '../../services/reports/reportService';

interface ShareModalProps {
  report: Report;
  userId: string;
  onClose: () => void;
  onReportUpdated: (updated: Report) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  report,
  userId,
  onClose,
  onReportUpdated,
}) => {
  const [expiryHours, setExpiryHours] = useState<number>(168); // Default 7 days
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isShared = report.sharing?.isShared && !report.sharing?.revoked;
  const shareUrl = report.sharing?.shareUrl || '';

  const handleGenerateOrUpdate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const { shareToken, shareUrl: newUrl, expiresAt } = await createShareLink(
        userId,
        report,
        expiryHours === 0 ? undefined : expiryHours
      );

      const updatedReport: Report = {
        ...report,
        sharing: {
          ...report.sharing,
          isShared: true,
          shareToken,
          shareUrl: newUrl,
          expiresAt,
          revoked: false,
        },
      };

      onReportUpdated(updatedReport);
    } catch (err: any) {
      setError(err.message || 'Failed to generate share link.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async () => {
    setIsGenerating(true);
    try {
      await revokeShareLink(userId, report.metadata.datasetId, report.metadata.reportId);
      const updated: Report = {
        ...report,
        sharing: {
          ...report.sharing,
          isShared: false,
          revoked: true,
        },
      };
      onReportUpdated(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to revoke link.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Share Report</h3>
            <p className="text-xs text-slate-500">
              Create a secure public read-only link for stakeholders
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-800">Public Link Access</span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  isShared
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {isShared ? 'Active' : 'Disabled'}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Anyone with this link can view the verified data, charts, and executive takeaways without needing an InsightAI account.
            </p>

            {isShared && shareUrl ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl font-mono text-slate-700 select-all focus:outline-hidden"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>Views: {report.sharing?.viewCount || 0}</span>
                  </div>
                  {report.sharing?.expiresAt && (
                    <div className="flex items-center gap-1.5 text-amber-700">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Expires: {new Date(report.sharing.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Expiration Settings */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Link Expiration</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '24 Hours', val: 24 },
                { label: '7 Days', val: 168 },
                { label: '30 Days', val: 720 },
                { label: 'Indefinite', val: 0 },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setExpiryHours(opt.val)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    expiryHours === opt.val
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          {isShared ? (
            <button
              onClick={handleRevoke}
              disabled={isGenerating}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Revoke Access</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleGenerateOrUpdate}
              disabled={isGenerating}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Link className="w-3.5 h-3.5" />
              <span>{isShared ? 'Update Link' : 'Generate Link'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

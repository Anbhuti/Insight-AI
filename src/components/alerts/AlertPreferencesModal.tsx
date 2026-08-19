import React, { useState, useEffect } from 'react';
import { NotificationPreferences, AlertSeverity } from '../../services/alerts/alertTypes';
import { SEVERITY_CONFIG, ALERT_CONSTANTS } from '../../services/alerts/alertConstants';
import AlertService from '../../services/alerts/alertsService';
import {
  X,
  Bell,
  Mail,
  Moon,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface AlertPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail?: string;
}

export const AlertPreferencesModal: React.FC<AlertPreferencesModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
}) => {
  if (!isOpen) return null;

  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailAddress, setEmailAddress] = useState(userEmail || '');
  const [minSeverity, setMinSeverity] = useState<AlertSeverity>('low');
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');
  const [quietHoursBypassCritical, setQuietHoursBypassCritical] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      if (userId) {
        const prefs = await AlertService.getPreferences(userId, userEmail);
        setInAppEnabled(prefs.inAppEnabled);
        setEmailEnabled(prefs.emailEnabled);
        setEmailAddress(prefs.emailAddress || userEmail || '');
        setMinSeverity(prefs.minSeverity);
        setQuietHoursEnabled(prefs.quietHoursEnabled);
        setQuietHoursStart(prefs.quietHoursStart);
        setQuietHoursEnd(prefs.quietHoursEnd);
        setQuietHoursBypassCritical(prefs.quietHoursBypassCritical);
      }
    }
    load();
  }, [userId, userEmail]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await AlertService.savePreferences(userId, {
        inAppEnabled,
        emailEnabled,
        emailAddress: emailAddress.trim(),
        minSeverity,
        quietHoursEnabled,
        quietHoursStart,
        quietHoursEnd,
        quietHoursBypassCritical,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 800);
    } catch (err) {
      console.error('Error saving alert preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Notification Preferences
              </h3>
              <p className="text-xs text-slate-500">
                Configure delivery channels and quiet hours
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* In-App Notifications */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    In-App Notification Center
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Display badge and alert dropdown in navigation bar
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={inAppEnabled}
                onChange={(e) => setInAppEnabled(e.target.checked)}
                className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Email Notifications */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Email Notifications
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Send alert executive briefings directly to email
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {emailEnabled && (
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="analyst@enterprise.com"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>
            )}
          </div>

          {/* Minimum Severity Filter */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Minimum Severity Threshold
            </label>
            <select
              value={minSeverity}
              onChange={(e) => setMinSeverity(e.target.value as AlertSeverity)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="info">Info (All Alerts)</option>
              <option value="low">Low and Above</option>
              <option value="medium">Medium and Above</option>
              <option value="high">High and Critical Only</option>
              <option value="critical">Critical Severity Only</option>
            </select>
          </div>

          {/* Quiet Hours */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-purple-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Quiet Hours
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Suppress non-urgent notifications during off-hours
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={quietHoursEnabled}
                onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {quietHoursEnabled && (
              <div className="space-y-3 pt-2 border-t border-slate-200/60">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={quietHoursStart}
                      onChange={(e) => setQuietHoursStart(e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={quietHoursEnd}
                      onChange={(e) => setQuietHoursEnd(e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="bypassCrit"
                    checked={quietHoursBypassCritical}
                    onChange={(e) => setQuietHoursBypassCritical(e.target.checked)}
                    className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="bypassCrit" className="text-xs text-slate-700 font-medium cursor-pointer">
                    Bypass quiet hours for <strong>Critical</strong> severity alerts
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Preferences</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

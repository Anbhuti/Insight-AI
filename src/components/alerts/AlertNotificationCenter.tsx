import React, { useState, useEffect, useRef } from 'react';
import { InAppNotification } from '../../services/alerts/alertTypes';
import { SEVERITY_CONFIG } from '../../services/alerts/alertConstants';
import AlertService from '../../services/alerts/alertsService';
import {
  Bell,
  CheckCircle2,
  Clock,
  ChevronRight,
  ExternalLink,
  Check,
  Layers,
} from 'lucide-react';

interface AlertNotificationCenterProps {
  userId: string;
  onNavigateToAlerts?: () => void;
  onSelectAlertId?: (alertId: string) => void;
}

export const AlertNotificationCenter: React.FC<AlertNotificationCenterProps> = ({
  userId,
  onNavigateToAlerts,
  onSelectAlertId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifs = async () => {
    if (!userId) return;
    try {
      const items = await AlertService.getNotifications(userId);
      setNotifications(items);
    } catch (err) {
      console.warn('Error loading notifications:', err);
    }
  };

  useEffect(() => {
    loadNotifs();
    const interval = setInterval(loadNotifs, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [userId]);

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasCriticalUnread = notifications.some((n) => !n.read && n.severity === 'critical');

  const handleMarkAsRead = async (notifId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    await AlertService.markNotificationAsRead(userId, notifId);
    setNotifications((prev) =>
      prev.map((n) => (n.notificationId === notifId ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = async () => {
    await AlertService.markAllNotificationsAsRead(userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = async (notif: InAppNotification) => {
    if (!notif.read) {
      await handleMarkAsRead(notif.notificationId);
    }
    setIsOpen(false);
    if (onSelectAlertId && notif.alertId) {
      onSelectAlertId(notif.alertId);
    } else if (onNavigateToAlerts) {
      onNavigateToAlerts();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Alert Notifications"
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className={`absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
              hasCriticalUnread ? 'bg-rose-600 animate-pulse' : 'bg-indigo-600'
            }`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900">Notifications</h4>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                <span>No alerts or notifications.</span>
              </div>
            ) : (
              notifications.slice(0, 12).map((notif) => {
                const sev = SEVERITY_CONFIG[notif.severity] || SEVERITY_CONFIG.info;
                return (
                  <div
                    key={notif.notificationId}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3 transition-colors cursor-pointer flex items-start gap-2.5 ${
                      notif.read ? 'bg-white hover:bg-slate-50' : 'bg-indigo-50/40 hover:bg-indigo-50/70'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${sev.dotClass} ${
                        !notif.read && notif.severity === 'critical' ? 'animate-pulse' : ''
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(notif.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>

                    {!notif.read && (
                      <button
                        onClick={(e) => handleMarkAsRead(notif.notificationId, e)}
                        title="Mark as read"
                        className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {onNavigateToAlerts && (
            <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToAlerts();
                }}
                className="w-full py-1.5 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <span>Go to Alert Engine &amp; Rules</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

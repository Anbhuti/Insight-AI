import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertInstance,
  AlertRule,
  AlertStatistics,
  AlertSeverity,
  AlertType,
  AlertStatus,
} from '../services/alerts/alertTypes';
import { SEVERITY_CONFIG, ALERT_TYPE_CONFIG } from '../services/alerts/alertConstants';
import AlertService from '../services/alerts/alertsService';
import { AlertCard } from '../components/alerts/AlertCard';
import { AlertDetailModal } from '../components/alerts/AlertDetailModal';
import { CreateAlertRuleModal } from '../components/alerts/CreateAlertRuleModal';
import { AlertRulesList } from '../components/alerts/AlertRulesList';
import { AlertPreferencesModal } from '../components/alerts/AlertPreferencesModal';
import { AlertAnalyticsView } from '../components/alerts/AlertAnalyticsView';
import { PermissionGate } from '../components/rbac/PermissionGate';
import { Dataset } from '../types/dataset';
import { DatasetProfile } from '../types/dataProfile';
import {
  Bell,
  Sliders,
  Plus,
  Play,
  Search,
  Filter,
  RefreshCw,
  Settings,
  ShieldAlert,
  CheckCircle2,
  BellOff,
  Activity,
  Layers,
  Database,
  Info,
} from 'lucide-react';

interface AlertsPageProps {
  userId: string;
  userEmail?: string;
  userDisplayName?: string;
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  onSelectDataset: (dataset: Dataset) => void;
  profiles: Record<string, DatasetProfile>;
  onNavigateToTab?: (tabName: string, params?: any) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  userId,
  userEmail,
  userDisplayName,
  datasets,
  selectedDataset,
  onSelectDataset,
  profiles,
  onNavigateToTab,
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<
    'active' | 'acknowledged' | 'snoozed' | 'resolved' | 'rules' | 'analytics'
  >('active');

  // Core state
  const [alerts, setAlerts] = useState<AlertInstance[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [stats, setStats] = useState<AlertStatistics>({
    totalTriggered: 0,
    activeCount: 0,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    acknowledgedCount: 0,
    snoozedCount: 0,
    resolvedCount: 0,
    avgResolutionTimeMinutes: 0,
  });

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDatasetId, setFilterDatasetId] = useState<string>(
    selectedDataset?.datasetId || 'all'
  );
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Modals state
  const [detailModalAlert, setDetailModalAlert] = useState<AlertInstance | null>(null);
  const [createRuleModalOpen, setCreateRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [prefsModalOpen, setPrefsModalOpen] = useState(false);

  // Scheduler evaluation loading
  const [isScanning, setIsScanning] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);

  // Load alert engine data
  const loadAlertsData = async () => {
    if (!userId) return;
    try {
      const [fetchedAlerts, fetchedRules, fetchedStats] = await Promise.all([
        AlertService.getAlerts(userId),
        AlertService.getRules(userId),
        AlertService.getAlertStatistics(userId),
      ]);
      setAlerts(fetchedAlerts);
      setRules(fetchedRules);
      setStats(fetchedStats);
    } catch (err) {
      console.warn('Error fetching alerts data:', err);
    }
  };

  useEffect(() => {
    loadAlertsData();
  }, [userId, selectedDataset]);

  // Handle Manual Scan & Evaluate All Rules
  const handleRunMonitorScan = async () => {
    if (!userId || datasets.length === 0) return;
    setIsScanning(true);
    setScanFeedback(null);
    try {
      const result = await AlertService.evaluateAllRules(
        userId,
        datasets,
        profiles,
        userEmail
      );
      await loadAlertsData();

      setScanFeedback(
        `Evaluation complete: ${result.evaluatedCount} rules evaluated. ${result.triggeredCount} new alerts triggered, ${result.resolvedCount} recovered.`
      );
      setTimeout(() => setScanFeedback(null), 5000);
    } catch (err: any) {
      setScanFeedback(`Scan error: ${err.message || 'Evaluation failed'}`);
    } finally {
      setIsScanning(false);
    }
  };

  // Alert Lifecycle Handlers
  const handleAcknowledgeAlert = async (alertId: string) => {
    await AlertService.acknowledgeAlert(userId, alertId, userDisplayName);
    await loadAlertsData();
  };

  const handleSnoozeAlert = async (alertId: string, durationMinutes: number) => {
    await AlertService.snoozeAlert(userId, alertId, durationMinutes);
    await loadAlertsData();
  };

  const handleResolveAlert = async (alertId: string, reason?: string) => {
    await AlertService.resolveAlert(userId, alertId, reason);
    await loadAlertsData();
  };

  // Rule Handlers
  const handleToggleRule = async (ruleId: string, currentEnabled: boolean) => {
    await AlertService.updateRule(userId, ruleId, { enabled: !currentEnabled });
    await loadAlertsData();
  };

  const handleDeleteRule = async (ruleId: string) => {
    await AlertService.deleteRule(userId, ruleId);
    await loadAlertsData();
  };

  const handleEditRule = (rule: AlertRule) => {
    setEditingRule(rule);
    setCreateRuleModalOpen(true);
  };

  // Filtered alerts based on current tab and filter controls
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      // Tab filter
      if (activeTab === 'active' && a.status !== 'triggered') return false;
      if (activeTab === 'acknowledged' && a.status !== 'acknowledged') return false;
      if (activeTab === 'snoozed' && a.status !== 'snoozed') return false;
      if (activeTab === 'resolved' && a.status !== 'resolved') return false;

      // Dataset filter
      if (filterDatasetId !== 'all' && a.datasetId !== filterDatasetId) return false;

      // Severity filter
      if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;

      // Type filter
      if (filterType !== 'all' && a.type !== filterType) return false;

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const titleMatch = a.title.toLowerCase().includes(q);
        const metricMatch = a.metric?.toLowerCase().includes(q);
        const dsMatch = a.datasetName?.toLowerCase().includes(q);
        const msgMatch = a.message?.toLowerCase().includes(q);
        if (!titleMatch && !metricMatch && !dsMatch && !msgMatch) return false;
      }

      return true;
    });
  }, [alerts, activeTab, filterDatasetId, filterSeverity, filterType, searchQuery]);

  // Tab count badges
  const activeCount = alerts.filter((a) => a.status === 'triggered').length;
  const acknowledgedCount = alerts.filter((a) => a.status === 'acknowledged').length;
  const snoozedCount = alerts.filter((a) => a.status === 'snoozed').length;
  const resolvedCount = alerts.filter((a) => a.status === 'resolved').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Intelligent Alerts &amp; Monitoring Engine
              </h1>
              <p className="text-xs text-slate-500">
                Continuous deterministic evaluation across business thresholds, trends, anomalies, and predictive forecasts.
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRunMonitorScan}
            disabled={isScanning}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Evaluating Rules...' : 'Run Monitor Scan'}</span>
          </button>

          <button
            onClick={() => setPrefsModalOpen(true)}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Notification Settings & Quiet Hours"
          >
            <Settings className="w-4 h-4" />
          </button>

          <PermissionGate
            permission="alert:create"
            fallback={
              <button
                disabled
                title="Your role (Viewer) cannot configure alert rules"
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed opacity-60"
              >
                <Plus className="w-4 h-4" />
                <span>Create Alert Rule</span>
              </button>
            }
          >
            <button
              onClick={() => {
                setEditingRule(null);
                setCreateRuleModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Alert Rule</span>
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Scan Feedback Banner */}
      {scanFeedback && (
        <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{scanFeedback}</span>
        </div>
      )}

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div
          onClick={() => setActiveTab('active')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'active'
              ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-200'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Active Alerts
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">
              {stats.activeCount}
            </span>
            {stats.criticalCount > 0 && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700">
                {stats.criticalCount} Critical
              </span>
            )}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('acknowledged')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'acknowledged'
              ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-200'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Acknowledged
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-indigo-700">
              {stats.acknowledgedCount}
            </span>
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('snoozed')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'snoozed'
              ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-200'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Snoozed
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-amber-700">
              {stats.snoozedCount}
            </span>
            <BellOff className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('resolved')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'resolved'
              ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-200'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Resolved
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-700">
              {stats.resolvedCount}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('rules')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'rules'
              ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-200'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Monitoring Rules
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-800">
              {rules.length}
            </span>
            <Sliders className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'active'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Active Alerts</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                activeTab === 'active' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('acknowledged')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'acknowledged'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Acknowledged</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                activeTab === 'acknowledged' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {acknowledgedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('snoozed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'snoozed'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Snoozed</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                activeTab === 'snoozed' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {snoozedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('resolved')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'resolved'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Resolved</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                activeTab === 'resolved' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {resolvedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Alert Rules</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                activeTab === 'rules' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {rules.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Analytics &amp; History</span>
          </button>
        </div>
      </div>

      {/* Filter and Search controls (for Alert list tabs) */}
      {activeTab !== 'rules' && activeTab !== 'analytics' && (
        <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alerts by title, metric, or dataset..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Dataset filter */}
            <select
              value={filterDatasetId}
              onChange={(e) => setFilterDatasetId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Datasets</option>
              {datasets.map((d) => (
                <option key={d.datasetId} value={d.datasetId}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Severity filter */}
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="high">High &amp; Critical</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
            </select>

            {/* Alert type filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Alert Types</option>
              {Object.entries(ALERT_TYPE_CONFIG).map(([k, c]) => (
                <option key={k} value={k}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main Tab Content Display */}
      {activeTab === 'rules' ? (
        <AlertRulesList
          rules={rules}
          datasets={datasets}
          profiles={profiles}
          userId={userId}
          onToggleRule={handleToggleRule}
          onEditRule={handleEditRule}
          onDeleteRule={handleDeleteRule}
          onOpenCreateModal={() => {
            setEditingRule(null);
            setCreateRuleModalOpen(true);
          }}
        />
      ) : activeTab === 'analytics' ? (
        <AlertAnalyticsView
          stats={stats}
          alerts={alerts}
          onViewAlertDetails={(alert) => setDetailModalAlert(alert)}
        />
      ) : (
        /* Alert Cards List */
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center bg-slate-50/50">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-800 mb-1">
                No {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Alerts Found
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                {activeTab === 'active'
                  ? 'All monitored business metrics are currently operating within defined thresholds and safe boundaries.'
                  : `No alert instances currently in '${activeTab}' status.`}
              </p>
              {rules.length === 0 && (
                <button
                  onClick={() => {
                    setEditingRule(null);
                    setCreateRuleModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Configure First Alert Rule</span>
                </button>
              )}
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.alertId}
                alert={alert}
                onAcknowledge={handleAcknowledgeAlert}
                onSnooze={handleSnoozeAlert}
                onResolve={(id) => handleResolveAlert(id)}
                onViewDetails={(a) => setDetailModalAlert(a)}
                onNavigateToAnomaly={(dsId) => onNavigateToTab?.('anomalies', { datasetId: dsId })}
                onNavigateToRCA={(dsId) => onNavigateToTab?.('rca', { datasetId: dsId })}
                onNavigateToForecast={(dsId) => onNavigateToTab?.('forecasting', { datasetId: dsId })}
                onNavigateToAnalyst={(dsId, prompt) =>
                  onNavigateToTab?.('analyst', { datasetId: dsId, prompt })
                }
              />
            ))
          )}
        </div>
      )}

      {/* Detail Modal */}
      <AlertDetailModal
        alert={detailModalAlert}
        isOpen={Boolean(detailModalAlert)}
        onClose={() => setDetailModalAlert(null)}
        onAcknowledge={handleAcknowledgeAlert}
        onSnooze={handleSnoozeAlert}
        onResolve={handleResolveAlert}
        onNavigateToAnomaly={(dsId) => {
          setDetailModalAlert(null);
          onNavigateToTab?.('anomalies', { datasetId: dsId });
        }}
        onNavigateToRCA={(dsId) => {
          setDetailModalAlert(null);
          onNavigateToTab?.('rca', { datasetId: dsId });
        }}
        onNavigateToForecast={(dsId) => {
          setDetailModalAlert(null);
          onNavigateToTab?.('forecasting', { datasetId: dsId });
        }}
        onNavigateToAnalyst={(dsId, prompt) => {
          setDetailModalAlert(null);
          onNavigateToTab?.('analyst', { datasetId: dsId, prompt });
        }}
      />

      {/* Create / Edit Rule Modal */}
      <CreateAlertRuleModal
        isOpen={createRuleModalOpen}
        onClose={() => {
          setCreateRuleModalOpen(false);
          setEditingRule(null);
        }}
        userId={userId}
        datasets={datasets}
        selectedDatasetId={selectedDataset?.datasetId}
        profiles={profiles}
        initialRule={editingRule}
        onRuleCreated={async () => {
          await loadAlertsData();
          setActiveTab('rules');
        }}
      />

      {/* Notification Preferences Modal */}
      <AlertPreferencesModal
        isOpen={prefsModalOpen}
        onClose={() => setPrefsModalOpen(false)}
        userId={userId}
        userEmail={userEmail}
      />
    </div>
  );
};

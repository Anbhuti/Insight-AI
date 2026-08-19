import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { OverviewView } from '../components/dashboard/OverviewView';
import { SubRoutePlaceholder } from './dashboard/SubRoutePlaceholder';
import { DatasetsPage } from './DatasetsPage';
import { AnalystPage } from './AnalystPage';
import { AnomaliesPage } from './AnomaliesPage';
import { RootCauseDashboard } from '../components/rootCause/RootCauseDashboard';
import { ForecastsPage } from './ForecastsPage';
import { ReportsPage } from '../components/reports/ReportsPage';
import { AlertsPage } from './AlertsPage';
import { TeamMembersTable } from '../components/rbac/TeamMembersTable';
import { RoleSimulationBar } from '../components/rbac/RoleSimulationBar';
import { RoleBadge } from '../components/rbac/RoleBadge';
import { AuditLogsView } from '../components/audit/AuditLogsView';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { getDatasets } from '../services/datasetService';
import { getDatasetProfile } from '../services/profilingService';
import { Dataset } from '../types/dataset';
import { DatasetProfile } from '../types/dataProfile';
import { Anomaly } from '../types/anomaly';
import { AppSubRoute, DateRange } from '../types/dashboard';
import {
  User as UserIcon,
  Database,
  Settings,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  X,
  Layers,
  FileSpreadsheet,
  Bot,
  FileText,
  Bell,
  CheckCircle2,
  Users,
  Shield,
  Building2,
} from 'lucide-react';

interface AppPageProps {
  initialSubRoute?: AppSubRoute;
  onNavigateHome: () => void;
  onSubRouteChange?: (subRoute: AppSubRoute) => void;
}

export const AppPage: React.FC<AppPageProps> = ({
  initialSubRoute = 'overview',
  onNavigateHome,
  onSubRouteChange,
}) => {
  const { user, userProfile, profileLoading, profileError, refreshProfile } = useAuth();
  const { currentOrganization, effectiveRole } = useWorkspace();
  const [currentSubRoute, setCurrentSubRoute] = useState<AppSubRoute>(initialSubRoute);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>('Last 30 days');
  const [activeModal, setActiveModal] = useState<'account' | 'settings' | 'schema' | null>(null);
  const [settingsTab, setSettingsTab] = useState<'team' | 'audit' | 'profile' | 'schema'>('team');
  const [isRetrying, setIsRetrying] = useState(false);

  // Shared Dataset & Anomaly Bridge State
  const [appDatasets, setAppDatasets] = useState<Dataset[]>([]);
  const [selectedAppDataset, setSelectedAppDataset] = useState<Dataset | null>(null);
  const [appProfiles, setAppProfiles] = useState<Record<string, DatasetProfile>>({});
  const [analystInitialDatasetId, setAnalystInitialDatasetId] = useState<string | undefined>();
  const [analystInitialPrompt, setAnalystInitialPrompt] = useState<string | undefined>();
  const [selectedRCAAnomaly, setSelectedRCAAnomaly] = useState<Anomaly | null>(null);

  // Fetch datasets for top-level routing and cross-page state
  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const loadData = async () => {
      try {
        const list = await getDatasets(user.uid);
        if (isMounted) {
          setAppDatasets(list);
          if (list.length > 0 && !selectedAppDataset) {
            setSelectedAppDataset(list[0]);
          }

          // Preload profiles
          for (const ds of list) {
            getDatasetProfile(user.uid, ds.datasetId).then((prof) => {
              if (prof && isMounted) {
                setAppProfiles((prev) => ({ ...prev, [ds.datasetId]: prof }));
              }
            });
          }
        }
      } catch (err) {
        console.warn('AppPage dataset fetch warning:', err);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    setCurrentSubRoute(initialSubRoute);
  }, [initialSubRoute]);

  const handleNavigateSubRoute = (subRoute: AppSubRoute) => {
    setCurrentSubRoute(subRoute);
    if (onSubRouteChange) {
      onSubRouteChange(subRoute);
    }
  };

  const handleRetryProfile = async () => {
    setIsRetrying(true);
    try {
      await refreshProfile();
    } finally {
      setIsRetrying(false);
    }
  };

  const displayName = userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'User';

  const schemaCollections = [
    {
      name: 'Users',
      path: `/users/${user?.uid || '{uid}'}`,
      desc: 'Stores individual user profiles, assigned roles, and subscription tier.',
      icon: UserIcon,
      status: 'Active in Phase 3',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      name: 'Organizations',
      path: '/organizations/{orgId}',
      desc: 'Multi-tenant organization boundary supporting workspaces and team members.',
      icon: Layers,
      status: 'Active in Phase 14',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    {
      name: 'Organization Members',
      path: '/organizations/{orgId}/members/{userId}',
      desc: 'Server-enforced role assignments (Owner, Admin, Analyst, Viewer).',
      icon: Users,
      status: 'Active in Phase 14',
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
    {
      name: 'Datasets',
      path: '/organizations/{orgId}/datasets',
      desc: 'Ingestion records for CSV, Excel, BigQuery, Snowflake, and Postgres sources.',
      icon: FileSpreadsheet,
      status: 'Active in Phase 5',
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      name: 'Analyses',
      path: '/organizations/{orgId}/analyses',
      desc: 'Natural language queries, anomaly detections, and root-cause investigation logs.',
      icon: Bot,
      status: 'Active in Phase 7',
      color: 'text-teal-600 bg-teal-50 border-teal-200',
    },
    {
      name: 'Reports',
      path: '/organizations/{orgId}/reports',
      desc: 'Narrative briefs, automated summaries, and board-ready intelligence reports.',
      icon: FileText,
      status: 'Active in Phase 12',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      name: 'Alerts',
      path: '/organizations/{orgId}/alerts',
      desc: 'Real-time statistical threshold triggers and autonomous background monitors.',
      icon: Bell,
      status: 'Active in Phase 13',
      color: 'text-rose-600 bg-rose-50 border-rose-200',
    },
  ];

  const renderSubRouteContent = () => {
    switch (currentSubRoute) {
      case 'overview':
        return <OverviewView onNavigateSubRoute={handleNavigateSubRoute} />;

      case 'analyst':
        return (
          <AnalystPage
            initialDatasetId={analystInitialDatasetId}
            initialPrompt={analystInitialPrompt}
            onNavigateToDatasets={() => handleNavigateSubRoute('datasets')}
          />
        );

      case 'root-cause':
        return (
          <RootCauseDashboard
            datasets={appDatasets}
            selectedDataset={selectedAppDataset}
            onSelectDataset={(d) => setSelectedAppDataset(d)}
            datasetProfiles={appProfiles}
            initialAnomaly={selectedRCAAnomaly}
            onOpenSQLWorkspace={() => handleNavigateSubRoute('sql')}
            onOpenAIAnalyst={() => handleNavigateSubRoute('analyst')}
          />
        );

      case 'anomalies':
        return (
          <AnomaliesPage
            datasets={appDatasets}
            selectedDataset={selectedAppDataset}
            onSelectDataset={(d) => setSelectedAppDataset(d)}
            datasetProfiles={appProfiles}
            onNavigateToAnalyst={(d, prompt) => {
              setSelectedAppDataset(d);
              setAnalystInitialDatasetId(d.datasetId);
              setAnalystInitialPrompt(prompt);
              handleNavigateSubRoute('analyst');
            }}
            onNavigateToSQL={(d, query) => {
              setSelectedAppDataset(d);
              setAnalystInitialDatasetId(d.datasetId);
              setAnalystInitialPrompt(query);
              handleNavigateSubRoute('analyst');
            }}
            onNavigateToRCA={(d, anomaly) => {
              setSelectedAppDataset(d);
              setSelectedRCAAnomaly(anomaly || null);
              handleNavigateSubRoute('root-cause');
            }}
            onNavigateToUpload={() => handleNavigateSubRoute('datasets')}
          />
        );

      case 'forecasts':
        return (
          <ForecastsPage
            datasets={appDatasets}
            selectedDataset={selectedAppDataset}
            onSelectDataset={(d) => setSelectedAppDataset(d)}
            datasetProfiles={appProfiles}
            onNavigateToAnalyst={(d, prompt) => {
              setSelectedAppDataset(d);
              setAnalystInitialDatasetId(d.datasetId);
              setAnalystInitialPrompt(prompt);
              handleNavigateSubRoute('analyst');
            }}
            onNavigateToSQL={(d, query) => {
              setSelectedAppDataset(d);
              setAnalystInitialDatasetId(d.datasetId);
              setAnalystInitialPrompt(query);
              handleNavigateSubRoute('analyst');
            }}
            onNavigateToUpload={() => handleNavigateSubRoute('datasets')}
          />
        );

      case 'reports':
        return (
          <ReportsPage
            userId={user?.uid || 'default_user'}
            userDisplayName={displayName}
            userEmail={user?.email || ''}
            datasets={appDatasets}
            selectedDataset={selectedAppDataset}
            onSelectDataset={(d) => setSelectedAppDataset(d)}
            datasetProfiles={appProfiles}
            onNavigateToUpload={() => handleNavigateSubRoute('datasets')}
          />
        );

      case 'alerts':
        return (
          <AlertsPage
            userId={user?.uid || 'default_user'}
            userDisplayName={displayName}
            userEmail={user?.email || ''}
            datasets={appDatasets}
            selectedDataset={selectedAppDataset}
            onSelectDataset={(d) => setSelectedAppDataset(d)}
            profiles={appProfiles}
            onNavigateToTab={(tabName, params) => {
              if (params?.datasetId) {
                const targetDs = appDatasets.find((d) => d.datasetId === params.datasetId);
                if (targetDs) setSelectedAppDataset(targetDs);
              }
              if (params?.prompt) {
                setAnalystInitialPrompt(params.prompt);
              }
              if (tabName === 'anomalies') handleNavigateSubRoute('anomalies');
              else if (tabName === 'rca') handleNavigateSubRoute('root-cause');
              else if (tabName === 'forecasting') handleNavigateSubRoute('forecasts');
              else if (tabName === 'analyst') handleNavigateSubRoute('analyst');
              else if (tabName === 'datasets') handleNavigateSubRoute('datasets');
            }}
          />
        );

      case 'sql':
        return (
          <AnalystPage
            initialDatasetId={analystInitialDatasetId}
            initialPrompt={analystInitialPrompt || 'Show total row count and top 5 summary records with SQL'}
            onNavigateToDatasets={() => handleNavigateSubRoute('datasets')}
          />
        );

      case 'datasets':
        return (
          <DatasetsPage
            initialAction="list"
            onNavigateToAnalyst={() => handleNavigateSubRoute('analyst')}
          />
        );

      case 'audit':
        return <AuditLogsView />;

      case 'settings':
        return (
          <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
            {/* Header Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      Workspace & Security Settings
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Multi-tenant organization management, team RBAC roles, and data security
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">Active Role:</span>
                  <RoleBadge role={effectiveRole} size="md" />
                </div>
              </div>

              {/* Settings Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-6 overflow-x-auto">
                <button
                  onClick={() => setSettingsTab('team')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                    settingsTab === 'team'
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Team & Access Control (RBAC)</span>
                </button>

                <button
                  onClick={() => setSettingsTab('audit')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                    settingsTab === 'audit'
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Audit Logs & Compliance</span>
                </button>

                <button
                  onClick={() => setSettingsTab('profile')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                    settingsTab === 'profile'
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Account & Organization</span>
                </button>

                <button
                  onClick={() => setSettingsTab('schema')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                    settingsTab === 'schema'
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  <span>Security & Firestore Rules</span>
                </button>
              </div>

              {/* Tab 1: Team & Access Control (RBAC) */}
              {settingsTab === 'team' && <TeamMembersTable />}

              {/* Tab 2: Audit Logs & Compliance */}
              {settingsTab === 'audit' && <AuditLogsView />}

              {/* Tab 2: Profile & Organization Information */}
              {settingsTab === 'profile' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs space-y-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Authenticated User Profile
                      </span>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{displayName}</p>
                        <p className="text-slate-500 mt-0.5">{user?.email}</p>
                      </div>
                      <div className="pt-2 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {userProfile?.plan || 'Free'} Plan
                        </span>
                        <RoleBadge role={effectiveRole} size="sm" />
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs space-y-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Active Workspace
                      </span>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">
                          {currentOrganization?.name || 'Workspace'}
                        </p>
                        <code className="text-[11px] text-indigo-600 font-mono block truncate mt-0.5">
                          ID: {currentOrganization?.id || 'org-default'}
                        </code>
                      </div>
                      <div className="pt-2 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {currentOrganization?.plan?.toUpperCase() || 'PRO'} WORKSPACE
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setActiveModal('account')}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      View Raw Profile Document →
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Security & Database Rules */}
              {settingsTab === 'schema' && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold">Server-Enforced Multi-Tenant Security Model</h4>
                      <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                        Data access, dataset ingestion, AI investigation agents, and report exports are strictly verified on both the Express server layer and Firestore security rules.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    {schemaCollections.map((col) => (
                      <div key={col.name} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-900">{col.name}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${col.color}`}>
                              {col.status}
                            </span>
                          </div>
                          <code className="text-[11px] text-indigo-600 font-mono block mb-1">
                            {col.path}
                          </code>
                          <p className="text-slate-500 text-[11px] leading-relaxed">{col.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        );

      default:
        return (
          <SubRoutePlaceholder
            route={currentSubRoute}
            onNavigateToOverview={() => handleNavigateSubRoute('overview')}
            onNavigateSubRoute={handleNavigateSubRoute}
          />
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* RBAC Role Perspective Simulation Toolbar */}
      <RoleSimulationBar />

      <DashboardLayout
        currentSubRoute={currentSubRoute}
        onNavigateSubRoute={handleNavigateSubRoute}
        onNavigateHome={onNavigateHome}
        selectedDateRange={selectedDateRange}
        onDateRangeChange={setSelectedDateRange}
      >
        {/* Profile Error Banner if Cloud Firestore sync has network hiccup */}
        {profileError && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Profile Sync Notice:</strong> Using cached session data ({profileError}).
              </span>
            </div>
            <button
              onClick={handleRetryProfile}
              disabled={isRetrying}
              className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-semibold flex items-center gap-1.5 hover:bg-amber-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Render Subroute or Overview with View-Level Error Boundary */}
        <ErrorBoundary key={currentSubRoute} fallbackTitle="View Recovery">
          {renderSubRouteContent()}
        </ErrorBoundary>

        {/* Account Profile Modal */}
        {activeModal === 'account' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div
              className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Firestore User Profile</h3>
                  <p className="text-xs text-slate-500">Stored in /users/{user?.uid}</p>
                </div>
              </div>
              <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/70 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Display Name:</span>
                  <span className="font-semibold text-slate-900">{displayName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-semibold text-slate-900">{userProfile?.email || user?.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Plan Tier:</span>
                  <span className="font-semibold text-emerald-700 capitalize">{userProfile?.plan || 'free'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Role:</span>
                  <span className="font-semibold text-indigo-700 uppercase">{effectiveRole}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Auth Provider:</span>
                  <span className="font-semibold text-slate-900">{userProfile?.provider || user?.providerData?.[0]?.providerId || 'password'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">User UID:</span>
                  <span className="font-mono text-[11px] text-slate-600 truncate max-w-[200px]">{user?.uid}</span>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between">
                <button
                  onClick={handleRetryProfile}
                  disabled={isRetrying}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                  <span>Refresh Record</span>
                </button>
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </div>
  );
};


import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  User as UserIcon,
  Settings,
  LogOut,
  Sparkles,
  Menu,
  X,
  Shield,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { WorkspaceSelector } from './WorkspaceSelector';
import { DateRangeSelector } from './DateRangeSelector';
import { AppSubRoute, DateRange } from '../../types/dashboard';
import { AlertNotificationCenter } from '../alerts/AlertNotificationCenter';

interface DashboardHeaderProps {
  currentSubRoute: AppSubRoute;
  onNavigateSubRoute: (route: AppSubRoute) => void;
  onOpenMobileMenu: () => void;
  selectedDateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onOpenSettingsModal?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  currentSubRoute,
  onNavigateSubRoute,
  onOpenMobileMenu,
  selectedDateRange,
  onDateRangeChange,
  onOpenSettingsModal,
}) => {
  const { user, userProfile, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || '';
  const greetingText = displayName ? `${getGreeting()}, ${displayName}` : getGreeting();

  const getSubRouteTitle = () => {
    switch (currentSubRoute) {
      case 'overview':
        return 'Overview';
      case 'analyst':
        return 'AI Analyst';
      case 'root-cause':
        return 'Root Cause Analysis (RCA)';
      case 'datasets':
        return 'Datasets';
      case 'sql':
        return 'SQL Workspace';
      case 'anomalies':
        return 'Anomalies';
      case 'forecasts':
        return 'Forecasts';
      case 'alerts':
        return 'Alerts';
      case 'reports':
        return 'Reports';
      case 'data-sources':
        return 'Data Sources';
      case 'settings':
        return 'Settings';
      default:
        return 'Overview';
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await logout();
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left Side: Mobile Menu Button + Page Title + Dynamic Greeting */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 cursor-pointer"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-tight truncate">
              {getSubRouteTitle()}
            </h1>
            <p className="text-xs text-slate-500 font-medium truncate">
              {greetingText}
            </p>
          </div>
        </div>

        {/* Right Side: Workspace, Date Selector, Search, Notifications, User Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Workspace selector */}
          <div className="hidden sm:block">
            <WorkspaceSelector />
          </div>

          {/* Date range selector (Visible on overview) */}
          {currentSubRoute === 'overview' && (
            <div className="hidden md:block">
              <DateRangeSelector
                value={selectedDateRange}
                onChange={onDateRangeChange}
              />
            </div>
          )}

          {/* Search Trigger */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            title="Search metrics, reports, or queries (⌘K)"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Real-time Alert Notification Center (Phase 13) */}
          <AlertNotificationCenter
            userId={user?.uid || ''}
            onNavigateToAlerts={() => onNavigateSubRoute('alerts')}
          />

          {/* User Profile Avatar & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 border border-slate-200/80 transition-all cursor-pointer"
              aria-label="User menu"
            >
              {userProfile?.photoURL || user?.photoURL ? (
                <img
                  src={userProfile?.photoURL || user?.photoURL || ''}
                  alt={displayName}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  {displayName ? displayName[0].toUpperCase() : 'U'}
                </div>
              )}
              
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[110px]">
                  {displayName || 'User'}
                </p>
                <p className="text-[10px] text-slate-400 font-medium truncate max-w-[110px] mt-0.5">
                  {userProfile?.role === 'admin' ? 'Admin' : 'Analyst'}
                </p>
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl p-2 border border-slate-200/90 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* User Info Header */}
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {displayName || 'InsightAI User'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                    {user?.email || 'user@insightai.com'}
                  </p>
                </div>

                {/* Navigation Options */}
                <div className="py-1 space-y-0.5 text-xs font-medium text-slate-700">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onNavigateSubRoute('settings');
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-slate-500" />
                    <span>Account Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      if (onOpenSettingsModal) onOpenSettingsModal();
                      else onNavigateSubRoute('settings');
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Workspace Settings</span>
                  </button>
                </div>

                {/* Sign Out */}
                <div className="pt-1 border-t border-slate-100 mt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2 rounded-xl text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2.5 cursor-pointer transition-colors text-xs font-semibold"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Visual Search Modal (Future-ready search mockup) */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-xl border border-slate-200 shadow-2xl p-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <Search className="w-5 h-5 text-indigo-600 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search metrics, reports, anomalies, or ask a question..."
                className="w-full text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              <button
                onClick={() => setSearchModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">Quick Navigation</p>
              <div className="space-y-1">
                {[
                  { label: 'Revenue Performance Report', sub: 'Last 30 days trend', route: 'overview' as AppSubRoute },
                  { label: 'Ask InsightAI: North Region Variance', sub: 'Launch AI analyst agent', route: 'analyst' as AppSubRoute },
                  { label: 'Forecasts & Predictive Model', sub: '30-day projection', route: 'forecasts' as AppSubRoute },
                  { label: 'Connected Datasets', sub: 'Sales, Customers, Orders', route: 'datasets' as AppSubRoute },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSearchModalOpen(false);
                      onNavigateSubRoute(item.route);
                    }}
                    className="w-full p-2 rounded-xl text-left hover:bg-indigo-50/70 hover:text-indigo-900 flex items-center justify-between text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="font-bold">{item.label}</p>
                      <p className="text-[10px] text-slate-400 font-normal">{item.sub}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Jump →</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

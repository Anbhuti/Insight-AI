import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  LayoutDashboard,
  Bot,
  Database,
  Terminal,
  AlertCircle,
  TrendingUp,
  Bell,
  FileText,
  PlugZap,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  X,
  ExternalLink,
  Compass,
  ShieldCheck,
} from 'lucide-react';
import { AppSubRoute } from '../../types/dashboard';

interface NavItem {
  id: AppSubRoute | 'help';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Analyze',
    items: [
      { id: 'analyst', label: 'AI Analyst', icon: Bot, badge: 'AI' },
      { id: 'root-cause', label: 'Root Cause (RCA)', icon: Compass, badge: 'RCA' },
      { id: 'datasets', label: 'Datasets', icon: Database },
      { id: 'sql', label: 'SQL Workspace', icon: Terminal },
    ],
  },
  {
    title: 'Monitor',
    items: [
      { id: 'anomalies', label: 'Anomalies', icon: AlertCircle, badge: '1' },
      { id: 'forecasts', label: 'Forecasts', icon: TrendingUp },
      { id: 'alerts', label: 'Alerts', icon: Bell },
    ],
  },
  {
    title: 'Workspace',
    items: [
      { id: 'reports', label: 'Reports', icon: FileText },
      { id: 'data-sources', label: 'Data Sources', icon: PlugZap },
      { id: 'audit', label: 'Audit Logs', icon: ShieldCheck, badge: 'SOC2' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { id: 'settings', label: 'Settings', icon: Settings },
      { id: 'help', label: 'Help & Support', icon: HelpCircle },
    ],
  },
];

interface DashboardSidebarProps {
  currentSubRoute: AppSubRoute;
  onNavigateSubRoute: (route: AppSubRoute) => void;
  onNavigateHome: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenHelpModal: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  currentSubRoute,
  onNavigateSubRoute,
  onNavigateHome,
  mobileOpen,
  onCloseMobile,
  onOpenHelpModal,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('insightai_sidebar_collapsed');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('insightai_sidebar_collapsed', String(next));
      } catch {
        // Ignore localStorage error
      }
      return next;
    });
  };

  const handleItemClick = (id: AppSubRoute | 'help') => {
    if (id === 'help') {
      onOpenHelpModal();
      onCloseMobile();
    } else {
      onNavigateSubRoute(id);
      onCloseMobile();
    }
  };

  const renderNavContent = (isMobile = false) => {
    const collapsed = !isMobile && isCollapsed;

    return (
      <div className="flex flex-col h-full justify-between select-none">
        
        {/* Top: Logo & Collapse Button */}
        <div>
          <div className={`flex items-center justify-between p-4 mb-2 border-b border-slate-100 ${collapsed ? 'px-3 justify-center' : ''}`}>
            
            {/* Logo */}
            <div
              onClick={() => onNavigateSubRoute('overview')}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              {!collapsed && (
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-base tracking-tight text-slate-900">
                    Insight<span className="text-indigo-600">AI</span>
                  </span>
                </div>
              )}
            </div>

            {/* Mobile Close Button */}
            {isMobile && (
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Desktop Collapse Toggle */}
            {!isMobile && !collapsed && (
              <button
                onClick={toggleCollapse}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Collapsed Expand Toggle Button (when collapsed) */}
          {!isMobile && collapsed && (
            <div className="flex justify-center mb-2">
              <button
                onClick={toggleCollapse}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation Sections */}
          <div className="px-3 space-y-5 overflow-y-auto max-h-[calc(100vh-210px)] scrollbar-thin">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-1">
                {!collapsed && (
                  <h4 className="px-2.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                    {section.title}
                  </h4>
                )}

                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentSubRoute === item.id;

                  return (
                    <div key={item.id} className="relative group/nav">
                      <button
                        onClick={() => handleItemClick(item.id)}
                        className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                          collapsed ? 'justify-center px-2' : 'justify-between'
                        } ${
                          isActive
                            ? 'bg-indigo-50/90 text-indigo-900 font-bold border border-indigo-200/70 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive ? 'text-indigo-600' : 'text-slate-400 group-hover/nav:text-slate-700'
                            }`}
                          />
                          {!collapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </div>

                        {!collapsed && item.badge && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                              item.badge === 'AI'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>

                      {/* Tooltip on Collapsed State */}
                      {collapsed && (
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover/nav:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold shadow-lg z-50 whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95">
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="text-[10px] px-1 bg-indigo-500 rounded text-white font-bold">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section: Back to Public Landing Page */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={onNavigateHome}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors cursor-pointer ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Return to Public Homepage"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Public Website</span>}
          </button>
        </div>

      </div>
    );
  };

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-slate-200/80 shrink-0 transition-all duration-200 sticky top-0 h-screen z-20 ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {renderNavContent(false)}
      </aside>

      {/* Mobile Drawer Backdrop & Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer Canvas */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
};

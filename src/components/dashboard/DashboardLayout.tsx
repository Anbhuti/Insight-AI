import React, { useState } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { AppSubRoute, DateRange } from '../../types/dashboard';
import { Sparkles, HelpCircle, X, Mail, Shield, BookOpen } from 'lucide-react';

interface DashboardLayoutProps {
  currentSubRoute: AppSubRoute;
  onNavigateSubRoute: (route: AppSubRoute) => void;
  onNavigateHome: () => void;
  selectedDateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentSubRoute,
  onNavigateSubRoute,
  onNavigateHome,
  selectedDateRange,
  onDateRangeChange,
  children,
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex font-sans antialiased overflow-x-hidden">
      
      {/* 1. Left Sidebar */}
      <DashboardSidebar
        currentSubRoute={currentSubRoute}
        onNavigateSubRoute={onNavigateSubRoute}
        onNavigateHome={onNavigateHome}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onOpenHelpModal={() => setHelpModalOpen(true)}
      />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header */}
        <DashboardHeader
          currentSubRoute={currentSubRoute}
          onNavigateSubRoute={onNavigateSubRoute}
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          selectedDateRange={selectedDateRange}
          onDateRangeChange={onDateRangeChange}
          onOpenSettingsModal={() => onNavigateSubRoute('settings')}
        />

        {/* Dynamic Main Body Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Help & Support Modal */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-200 shadow-2xl p-6 relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setHelpModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Help & Support</h3>
                <p className="text-xs text-slate-500">InsightAI Documentation & Assistance</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Platform Documentation</span>
                </div>
                <p className="text-slate-500">
                  Explore guides on dataset formats, metric definitions, and how the autonomous agent investigates anomalies.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  <span>Direct Engineering Support</span>
                </div>
                <p className="text-slate-500">
                  Need help configuring custom pipelines? Reach out to support@insightai.com.
                </p>
              </div>
            </div>

            <button
              onClick={() => setHelpModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

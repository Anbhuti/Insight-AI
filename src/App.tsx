import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { IntroductionSection } from './components/IntroductionSection';
import { DataConnectionSection } from './components/DataConnectionSection';
import { AIAnalystSection } from './components/AIAnalystSection';
import { AgentWorkflow } from './components/AgentWorkflow';
import { AnomalySection } from './components/AnomalySection';
import { RootCauseSection } from './components/RootCauseSection';
import { ForecastSection } from './components/ForecastSection';
import { BusinessHealth } from './components/BusinessHealth';
import { AutomatedMonitoring } from './components/AutomatedMonitoring';
import { ReportSection } from './components/ReportSection';
import { SecuritySection } from './components/SecuritySection';
import { UseCasesSection } from './components/UseCasesSection';
import { ComparisonSection } from './components/ComparisonSection';
import { InteractiveDemo } from './components/InteractiveDemo';
import { FAQSection } from './components/FAQSection';
import { CTASection } from './components/CTASection';
import { Footer } from './components/Footer';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { AppPage } from './pages/AppPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppSubRoute } from './types/dashboard';
import { ErrorBoundary } from './components/common/ErrorBoundary';

type AppRoute = 'home' | 'login' | 'signup' | 'app';

interface ParsedRoute {
  route: AppRoute;
  subRoute: AppSubRoute;
}

function getRouteFromUrl(): ParsedRoute {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  if (path === '/login' || hash === '#/login' || hash === '#login') {
    return { route: 'login', subRoute: 'overview' };
  }
  if (path === '/signup' || hash === '#/signup' || hash === '#signup') {
    return { route: 'signup', subRoute: 'overview' };
  }

  // Parse /app and /app/* routes
  if (path.startsWith('/app') || hash.startsWith('#/app') || hash.startsWith('#app')) {
    const rawSub = path.replace('/app', '').replace(/^\//, '') ||
      hash.replace(/^#\/?app/, '').replace(/^\//, '');

    const validSubRoutes: AppSubRoute[] = [
      'overview',
      'analyst',
      'datasets',
      'sql',
      'anomalies',
      'root-cause',
      'forecasts',
      'alerts',
      'reports',
      'data-sources',
      'audit',
      'settings',
    ];

    const matchedSub = validSubRoutes.find((r) => r === rawSub);
    return {
      route: 'app',
      subRoute: matchedSub || 'overview',
    };
  }

  return { route: 'home', subRoute: 'overview' };
}

function MainApp() {
  const { user } = useAuth();
  const [currentRouteState, setCurrentRouteState] = useState<ParsedRoute>(getRouteFromUrl);

  const { route: currentRoute, subRoute: currentSubRoute } = currentRouteState;

  const navigate = useCallback((route: AppRoute, subRoute: AppSubRoute = 'overview') => {
    setCurrentRouteState({ route, subRoute });

    let targetPath = '/';
    if (route === 'login') targetPath = '/login';
    else if (route === 'signup') targetPath = '/signup';
    else if (route === 'app') {
      targetPath = subRoute === 'overview' ? '/app' : `/app/${subRoute}`;
    }

    if (window.location.pathname !== targetPath) {
      window.history.pushState({ route, subRoute }, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSubRouteChange = useCallback((subRoute: AppSubRoute) => {
    setCurrentRouteState((prev) => ({ ...prev, subRoute }));
    const targetPath = subRoute === 'overview' ? '/app' : `/app/${subRoute}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ route: 'app', subRoute }, '', targetPath);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRouteState(getRouteFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleStartAnalyzing = () => {
    if (user) {
      navigate('app', 'overview');
    } else {
      navigate('signup');
    }
  };

  const handleScrollToSection = (sectionId: string) => {
    if (currentRoute !== 'home') {
      navigate('home');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Route 1: Login Page
  if (currentRoute === 'login') {
    return (
      <LoginPage
        onNavigateHome={() => navigate('home')}
        onNavigateToSignup={() => navigate('signup')}
        onLoginSuccess={() => navigate('app', 'overview')}
      />
    );
  }

  // Route 2: Signup Page
  if (currentRoute === 'signup') {
    return (
      <SignupPage
        onNavigateHome={() => navigate('home')}
        onNavigateToLogin={() => navigate('login')}
        onSignupSuccess={() => navigate('app', 'overview')}
      />
    );
  }

  // Route 3: Protected App Analytics Workspace
  if (currentRoute === 'app') {
    return (
      <ProtectedRoute onRedirectToLogin={() => navigate('login')}>
        <AppPage
          initialSubRoute={currentSubRoute}
          onNavigateHome={() => navigate('home')}
          onSubRouteChange={handleSubRouteChange}
        />
      </ProtectedRoute>
    );
  }

  // Route 4: Phase 1 Landing Page (Preserved 100% identically)
  return (
    <div className="min-h-screen bg-[#FCFBFE] pastel-mesh-bg text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 font-sans antialiased overflow-x-hidden">
      
      {/* Sticky Header */}
      <Navbar
        onNavigate={(r) => navigate(r)}
        onOpenDemo={() => handleScrollToSection('demo')}
      />

      {/* Main Landing Page Flow */}
      <main className="flex flex-col gap-2">
        
        {/* 1. Hero & Interactive Product Canvas */}
        <div id="product">
          <Hero
            onStartAnalyzing={handleStartAnalyzing}
            onSeeHowItWorks={() => handleScrollToSection('workflow')}
          />
        </div>

        {/* 2. Introduction: Raw Data -> Analysis -> Insight -> Decision */}
        <IntroductionSection />

        {/* 3. Data Connection: CSV, Excel, PostgreSQL, MySQL, Sheets, API */}
        <DataConnectionSection />

        {/* 4. AI Analyst Natural Language Interface */}
        <AIAnalystSection />

        {/* 5. Agent Workflow: 7-Step Autonomous Investigation Loop */}
        <AgentWorkflow />

        {/* 6. Anomaly Detection Dashboard */}
        <AnomalySection />

        {/* 7. Root Cause Multivariate Attribution Tree */}
        <RootCauseSection />

        {/* 8. Predictive Time-Series Forecasting & Scenario Simulator */}
        <ForecastSection />

        {/* 9. Business Health Consolidated Index & KPIs */}
        <BusinessHealth />

        {/* 10. Automated 24/7 Proactive Surveillance */}
        <AutomatedMonitoring
          onOpenAnalysis={() => handleScrollToSection('anomalies')}
        />

        {/* 11. Executive Report Generation Preview */}
        <ReportSection
          onGenerateReport={handleStartAnalyzing}
        />

        {/* 12. Security & Governance */}
        <SecuritySection />

        {/* 13. Departmental Use Cases & Mini Dashboards */}
        <UseCasesSection />

        {/* 14. Comparison Matrix: Traditional BI vs Generic Chatbots vs InsightAI */}
        <ComparisonSection />

        {/* 15. Hands-On Interactive Sandbox */}
        <InteractiveDemo />

        {/* 16. FAQ Accordion */}
        <FAQSection />

        {/* 17. Final Call to Action */}
        <CTASection
          onStartAnalyzing={handleStartAnalyzing}
          onExploreAgent={() => handleScrollToSection('demo')}
        />

      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="InsightAI Application Recovery" fallbackMessage="An unexpected error occurred in the application shell. You can reload safely.">
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}

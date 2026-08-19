import React, { useEffect } from 'react';
import { Sparkles, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LoginForm } from '../components/auth/LoginForm';

interface LoginPageProps {
  onNavigateHome: () => void;
  onNavigateToSignup: () => void;
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateHome,
  onNavigateToSignup,
  onLoginSuccess,
}) => {
  const { user, loading } = useAuth();

  // If already authenticated, redirect to /app
  useEffect(() => {
    if (!loading && user) {
      onLoginSuccess();
    }
  }, [user, loading, onLoginSuccess]);

  return (
    <div className="min-h-screen bg-[#FCFBFE] pastel-mesh-bg flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans antialiased text-slate-900">
      
      {/* Top Bar with Brand and Back Link */}
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between py-2">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2 group cursor-pointer focus:outline-none"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            ✦ Insight<span className="text-indigo-600">AI</span>
          </span>
        </button>

        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>
      </header>

      {/* Center Auth Card */}
      <main className="flex-1 flex items-center justify-center my-6">
        <div className="w-full max-w-md bg-white rounded-[32px] sm:rounded-[40px] p-7 sm:p-10 border border-slate-200/80 shadow-2xl shadow-slate-200/60 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          
          {/* Ambient Card Background Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-50/70 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-50/70 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            
            {/* Header Text */}
            <div className="text-center mb-7">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-3">
                <Sparkles className="w-3 h-3 text-indigo-600" />
                <span>✦ InsightAI Workspace</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome back.
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5">
                Sign in to continue analyzing your data.
              </p>
            </div>

            {/* Login Form */}
            <LoginForm
              onSuccess={onLoginSuccess}
              onNavigateToSignup={onNavigateToSignup}
            />

          </div>

        </div>
      </main>

      {/* Footer Security Guarantee */}
      <footer className="max-w-md w-full mx-auto text-center text-xs text-slate-400 flex items-center justify-center gap-2 py-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>End-to-end encrypted session • Read-only data safety</span>
      </footer>

    </div>
  );
};

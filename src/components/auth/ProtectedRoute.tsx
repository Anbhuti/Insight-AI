import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Sparkles } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  onRedirectToLogin: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  onRedirectToLogin,
}) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      onRedirectToLogin();
    }
  }, [user, loading, onRedirectToLogin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCFBFE] pastel-mesh-bg flex flex-col items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 flex flex-col items-center gap-4 text-center max-w-xs w-full animate-in fade-in duration-300">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">Authenticating</h4>
            <p className="text-xs text-slate-500 mt-0.5">Verifying secure session...</p>
          </div>
          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin mt-1" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Database, 
  Lock, 
  ShieldCheck,
  Send,
  Zap
} from 'lucide-react';

interface Phase2ModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'workspace';
}

export const Phase2Modal: React.FC<Phase2ModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signup',
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [role, setRole] = useState('Executive / Founder');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-lg bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200/80 shadow-2xl shadow-slate-950/30 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSubmitted ? (
          <div className="flex flex-col gap-5">
            
            {/* Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  Phase 1 Preview • Phase 2 Early Access
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  {initialMode === 'login' ? 'Welcome Back to InsightAI' : 'Join the VIP Early Access'}
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              We are currently in <strong>Phase 1 UI/UX Preview</strong>. Register your email below to receive priority access to the live SQL engine, automated anomaly watcher, and autonomous reporting in Phase 2.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Work Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Your Primary Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option>Executive / Founder</option>
                  <option>Head of Sales / Commercial</option>
                  <option>Head of Finance / CFO</option>
                  <option>Operations / Supply Chain</option>
                  <option>Analytics / BI Specialist</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-slate-900 hover:bg-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 transition-all cursor-pointer mt-2"
              >
                <span>Request Priority Workspace Access</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Read-Only Security Guarantee
              </span>
              <span>Phase 2 Launching Soon</span>
            </div>

          </div>
        ) : (
          <div className="text-center py-6 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-sm animate-in zoom-in-75 duration-300">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900">
              You're on the VIP List!
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 max-w-sm leading-relaxed">
              We saved your spot for <strong>{email}</strong>. You'll receive early invite credentials when Phase 2 full application connects.
            </p>

            <button
              onClick={() => {
                setIsSubmitted(false);
                setEmail('');
                onClose();
              }}
              className="mt-3 px-6 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-indigo-600 transition-colors cursor-pointer"
            >
              Back to Landing Page
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

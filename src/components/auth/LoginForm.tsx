import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, CheckCircle2, ArrowRight, Loader2, KeyRound, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GoogleSignInButton } from './GoogleSignInButton';

interface LoginFormProps {
  onSuccess: () => void;
  onNavigateToSignup: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onNavigateToSignup,
}) => {
  const { login, loginWithGoogle, resetPassword, isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      errors.email = 'Please enter your email address.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Please enter your password.';
    } else if (password.length < 8) {
      errors.password = 'Password must contain at least 8 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      setFormError(err.message || 'The email or password is incorrect.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSubmit = async () => {
    setFormError(null);
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      onSuccess();
    } catch (err: any) {
      setFormError(err.message || 'Google sign-in could not be completed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!forgotEmail.trim() || !emailRegex.test(forgotEmail.trim())) {
      setForgotError('Please enter a valid email address.');
      return;
    }

    setForgotLoading(true);
    try {
      await resetPassword(forgotEmail);
      setForgotSuccess(true);
    } catch (err: any) {
      setForgotError(err.message || 'Could not send reset email. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="w-full">
      
      {!isConfigured && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block mb-0.5">Firebase Configuration Required</strong>
            <span>
              Please provide your Firebase credentials (<code className="bg-amber-100 px-1 py-0.5 rounded">VITE_FIREBASE_API_KEY</code>, etc.) in your environment variables to enable live authentication.
            </span>
          </div>
        </div>
      )}

      {/* Top Banner Error */}
      {formError && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-800 flex items-start gap-2.5 animate-in fade-in duration-200"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="font-medium">{formError}</span>
        </div>
      )}

      {/* Email & Password Form */}
      <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
        
        {/* Email Field */}
        <div>
          <label
            htmlFor="login-email"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              placeholder="you@company.com"
              disabled={isLoading || isGoogleLoading}
              className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                fieldErrors.email
                  ? 'border-rose-300 focus:ring-rose-400 focus:border-rose-400'
                  : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
          </div>
          {fieldErrors.email && (
            <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{fieldErrors.email}</span>
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="login-password"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => {
                setForgotEmail(email);
                setForgotSuccess(false);
                setForgotError(null);
                setShowForgotModal(true);
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="login-password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              placeholder="Enter your password"
              disabled={isLoading || isGoogleLoading}
              className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                fieldErrors.password
                  ? 'border-rose-300 focus:ring-rose-400 focus:border-rose-400'
                  : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
          </div>
          {fieldErrors.password && (
            <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{fieldErrors.password}</span>
            </p>
          )}
        </div>

        {/* Primary Sign In Button */}
        <button
          type="submit"
          id="btn-login-submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 hover:shadow-indigo-500/20 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 text-white animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <span className="relative px-3 bg-white text-xs font-bold text-slate-400 uppercase tracking-wider">
          OR
        </span>
      </div>

      {/* Google Sign-in */}
      <GoogleSignInButton
        onClick={handleGoogleSubmit}
        isLoading={isGoogleLoading}
        disabled={isLoading}
      />

      {/* Toggle to Signup */}
      <div className="mt-6 text-center text-xs sm:text-sm text-slate-600">
        <span>Don't have an account? </span>
        <button
          type="button"
          onClick={onNavigateToSignup}
          className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
        >
          Sign up
        </button>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Reset Password</h4>
                <p className="text-xs text-slate-500">Enter your email to receive recovery instructions</p>
              </div>
            </div>

            {forgotSuccess ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-1">Check your inbox</span>
                    <span>If an account exists for this email, we've sent a password reset link.</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                {forgotError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Account Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@company.com"
                    disabled={forgotLoading}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    disabled={forgotLoading}
                    className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Send Reset Link</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

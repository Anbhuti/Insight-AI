import React, { useState } from 'react';
import { User as UserIcon, Mail, Lock, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GoogleSignInButton } from './GoogleSignInButton';

interface SignupFormProps {
  onSuccess: () => void;
  onNavigateToLogin: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSuccess,
  onNavigateToLogin,
}) => {
  const { signup, loginWithGoogle, isConfigured } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const validateForm = (): boolean => {
    const errors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      errors.email = 'Please enter your email address.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Please enter a password.';
    } else if (password.length < 8) {
      errors.password = 'Password must contain at least 8 characters.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
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
      await signup(email, password, fullName);
      onSuccess();
    } catch (err: any) {
      setFormError(err.message || 'An account with this email already exists.');
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
      setFormError(err.message || 'Google sign-up could not be completed.');
    } finally {
      setIsGoogleLoading(false);
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
              Please provide your Firebase credentials in your environment variables to enable live account creation.
            </span>
          </div>
        </div>
      )}

      {/* Top Form Error */}
      {formError && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-800 flex items-start gap-2.5 animate-in fade-in duration-200"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="font-medium">{formError}</span>
        </div>
      )}

      <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
        {/* Full Name */}
        <div>
          <label
            htmlFor="signup-name"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Full Name (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <UserIcon className="w-4 h-4" />
            </div>
            <input
              id="signup-name"
              type="text"
              name="name"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Alex Morgan"
              disabled={isLoading || isGoogleLoading}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="signup-email"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Work Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="signup-email"
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

        {/* Password */}
        <div>
          <label
            htmlFor="signup-password"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="signup-password"
              type="password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              placeholder="Minimum 8 characters"
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

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="signup-confirm-password"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="signup-confirm-password"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }
              }}
              placeholder="Confirm your password"
              disabled={isLoading || isGoogleLoading}
              className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                fieldErrors.confirmPassword
                  ? 'border-rose-300 focus:ring-rose-400 focus:border-rose-400'
                  : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
          </div>
          {fieldErrors.confirmPassword && (
            <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{fieldErrors.confirmPassword}</span>
            </p>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          id="btn-signup-submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 hover:shadow-indigo-500/20 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 text-white animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
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

      {/* Toggle to Login */}
      <div className="mt-6 text-center text-xs sm:text-sm text-slate-600">
        <span>Already have an account? </span>
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
        >
          Sign in
        </button>
      </div>
    </div>
  );
};

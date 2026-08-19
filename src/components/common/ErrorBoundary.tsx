import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 sm:p-8 max-w-2xl mx-auto my-8 bg-white rounded-3xl border border-rose-200/80 shadow-lg text-slate-800 animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-lg font-bold text-slate-900">
                {this.props.fallbackTitle || 'Component Encountered an Issue'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {this.props.fallbackMessage ||
                  'An unexpected client-side error occurred in this view. Your other application tabs and data remain safe.'}
              </p>

              {process.env.NODE_ENV !== 'production' && this.state.error && (
                <div className="mt-3 p-3 bg-slate-900 text-rose-300 rounded-xl text-xs font-mono overflow-x-auto max-h-40">
                  <p className="font-semibold text-white">{this.state.error.name}: {this.state.error.message}</p>
                  {this.state.error.stack && (
                    <pre className="text-[11px] text-slate-400 mt-1 whitespace-pre-wrap">{this.state.error.stack.slice(0, 400)}</pre>
                  )}
                </div>
              )}

              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reload Component</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Refresh App</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

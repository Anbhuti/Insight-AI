import React from 'react';
import { Database, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Database,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="w-full p-8 sm:p-12 text-center flex flex-col items-center justify-center rounded-2xl bg-white/70 border border-dashed border-slate-300">
      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-2xs">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-base font-bold text-slate-900 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-2xs cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

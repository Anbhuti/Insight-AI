import React, { useState } from 'react';
import { Dataset } from '../../types/dataset';
import { X, Edit2, Loader2 } from 'lucide-react';

interface RenameDatasetModalProps {
  dataset: Dataset;
  isOpen: boolean;
  onClose: () => void;
  onSave: (datasetId: string, newName: string) => Promise<void>;
}

export const RenameDatasetModal: React.FC<RenameDatasetModalProps> = ({
  dataset,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(dataset.name);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Dataset name cannot be empty.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave(dataset.datasetId, trimmed);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to rename dataset.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Edit2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Rename Dataset</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Dataset Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm font-semibold text-slate-900 focus:outline-none transition-all"
              placeholder="Enter new dataset name"
            />
            {error && <p className="text-xs font-medium text-rose-600 mt-1.5">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Name</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

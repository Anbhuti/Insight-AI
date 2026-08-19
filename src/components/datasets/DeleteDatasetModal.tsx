import React, { useState } from 'react';
import { Dataset } from '../../types/dataset';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';

interface DeleteDatasetModalProps {
  dataset: Dataset;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (datasetId: string, storagePath: string) => Promise<void>;
}

export const DeleteDatasetModal: React.FC<DeleteDatasetModalProps> = ({
  dataset,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await onConfirmDelete(dataset.datasetId, dataset.storagePath);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete dataset.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <Trash2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Dataset</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Content */}
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            Are you sure you want to permanently delete{' '}
            <span className="font-bold text-slate-900">"{dataset.name}"</span>?
          </p>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              This will remove the uploaded file from Cloud Storage and all registered dataset metadata. This action cannot be undone.
            </span>
          </div>

          {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Delete Dataset</span>
          </button>
        </div>

      </div>
    </div>
  );
};

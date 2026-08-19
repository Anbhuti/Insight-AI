import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Dataset } from '../types/dataset';
import { getDatasets, updateDatasetName, deleteDataset } from '../services/datasetService';
import { DatasetList } from '../components/datasets/DatasetList';
import { DatasetUpload } from '../components/datasets/DatasetUpload';
import { DatasetDetailsView } from '../components/datasets/DatasetDetailsView';
import { RenameDatasetModal } from '../components/datasets/RenameDatasetModal';
import { DeleteDatasetModal } from '../components/datasets/DeleteDatasetModal';
import { PermissionGate } from '../components/rbac/PermissionGate';
import {
  Database,
  UploadCloud,
  Layers,
  Sparkles,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface DatasetsPageProps {
  initialAction?: 'list' | 'upload';
  selectedDatasetId?: string | null;
  onNavigateToAnalyst?: (dataset?: Dataset) => void;
}

export const DatasetsPage: React.FC<DatasetsPageProps> = ({
  initialAction = 'list',
  selectedDatasetId = null,
  onNavigateToAnalyst,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'list' | 'upload'>(initialAction);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

  // Modals state
  const [renamingDataset, setRenamingDataset] = useState<Dataset | null>(null);
  const [deletingDataset, setDeletingDataset] = useState<Dataset | null>(null);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const fetchUserDatasets = useCallback(async () => {
    if (!user) {
      setDatasets([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getDatasets(user.uid);
      setDatasets(data);

      if (selectedDatasetId) {
        const found = data.find((d) => d.datasetId === selectedDatasetId);
        if (found) setSelectedDataset(found);
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedDatasetId]);

  useEffect(() => {
    fetchUserDatasets();
  }, [fetchUserDatasets]);

  const handleUploadComplete = (newDataset: Dataset) => {
    setDatasets((prev) => [newDataset, ...prev.filter((d) => d.datasetId !== newDataset.datasetId)]);
    setBannerNotice(`"${newDataset.name}" was uploaded successfully.`);
    setTimeout(() => setBannerNotice(null), 4000);
  };

  const handleViewDetails = (dataset: Dataset) => {
    setSelectedDataset(dataset);
  };

  const handleSaveRename = async (datasetId: string, newName: string) => {
    if (!user) return;
    await updateDatasetName(user.uid, datasetId, newName);
    setDatasets((prev) =>
      prev.map((d) => (d.datasetId === datasetId ? { ...d, name: newName } : d))
    );
    if (selectedDataset && selectedDataset.datasetId === datasetId) {
      setSelectedDataset((prev) => (prev ? { ...prev, name: newName } : null));
    }
    setBannerNotice('Dataset renamed successfully.');
    setTimeout(() => setBannerNotice(null), 3000);
  };

  const handleConfirmDelete = async (datasetId: string, storagePath: string) => {
    if (!user) return;
    await deleteDataset(user.uid, datasetId, storagePath);
    setDatasets((prev) => prev.filter((d) => d.datasetId !== datasetId));
    if (selectedDataset && selectedDataset.datasetId === datasetId) {
      setSelectedDataset(null);
    }
    setBannerNotice('Dataset deleted successfully.');
    setTimeout(() => setBannerNotice(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Toast / Banner notice */}
      {bannerNotice && (
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{bannerNotice}</span>
          </div>
          <button
            onClick={() => setBannerNotice(null)}
            className="text-slate-400 hover:text-white text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* If a dataset is selected for deep inspection, show Details View */}
      {selectedDataset ? (
        <DatasetDetailsView
          dataset={selectedDataset}
          onBack={() => setSelectedDataset(null)}
          onRename={setRenamingDataset}
          onDelete={setDeletingDataset}
          onNavigateToAnalyst={onNavigateToAnalyst}
        />
      ) : (
        <>
          {/* Main Header & Navigation Tabs */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                    Dataset Management
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                    Securely upload, preview, and manage your CSV and Excel business datasets.
                  </p>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
                <button
                  onClick={() => setActiveTab('list')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'list'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>My Datasets</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
                    {datasets.length}
                  </span>
                </button>

                <PermissionGate
                  permission="dataset:create"
                  fallback={
                    <button
                      disabled
                      title="Your current role (Viewer) cannot upload datasets"
                      className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 text-slate-400 opacity-60 cursor-not-allowed"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload Dataset</span>
                    </button>
                  }
                >
                  <button
                    onClick={() => setActiveTab('upload')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      activeTab === 'upload'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Dataset</span>
                  </button>
                </PermissionGate>
              </div>
            </div>
          </div>

          {/* Active View */}
          {activeTab === 'upload' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Upload New Dataset</h3>
                <button
                  onClick={() => setActiveTab('list')}
                  className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  View existing datasets ({datasets.length})
                </button>
              </div>
              <DatasetUpload
                onUploadComplete={handleUploadComplete}
                onViewDataset={(id) => {
                  const ds = datasets.find((d) => d.datasetId === id);
                  if (ds) setSelectedDataset(ds);
                  else setActiveTab('list');
                }}
              />
            </div>
          ) : (
            <DatasetList
              datasets={datasets}
              isLoading={isLoading}
              onView={handleViewDetails}
              onRename={setRenamingDataset}
              onDelete={setDeletingDataset}
              onUploadClick={() => setActiveTab('upload')}
            />
          )}
        </>
      )}

      {/* Modals */}
      {renamingDataset && (
        <RenameDatasetModal
          dataset={renamingDataset}
          isOpen={Boolean(renamingDataset)}
          onClose={() => setRenamingDataset(null)}
          onSave={handleSaveRename}
        />
      )}

      {deletingDataset && (
        <DeleteDatasetModal
          dataset={deletingDataset}
          isOpen={Boolean(deletingDataset)}
          onClose={() => setDeletingDataset(null)}
          onConfirmDelete={handleConfirmDelete}
        />
      )}

    </div>
  );
};

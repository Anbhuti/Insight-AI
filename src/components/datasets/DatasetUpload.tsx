import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  UploadState,
  DatasetPreview,
  UploadProgressInfo,
  Dataset,
} from '../../types/dataset';
import { validateDatasetFile, parseDatasetFile } from '../../utils/fileParser';
import { uploadDatasetFile } from '../../services/storageService';
import { createDatasetMetadata, formatDatasetNameFromFileName } from '../../services/datasetService';
import { UploadDropzone } from './UploadDropzone';
import { UploadProgress } from './UploadProgress';
import { FilePreview } from './FilePreview';
import { UploadError } from './UploadError';
import { CheckCircle2, ArrowRight, UploadCloud, FileSpreadsheet, Plus } from 'lucide-react';

interface DatasetUploadProps {
  onUploadComplete?: (newDataset: Dataset) => void;
  onViewDataset?: (datasetId: string) => void;
}

export const DatasetUpload: React.FC<DatasetUploadProps> = ({
  onUploadComplete,
  onViewDataset,
}) => {
  const { user } = useAuth();
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState<string>('');
  const [preview, setPreview] = useState<DatasetPreview | null>(null);
  const [progress, setProgress] = useState<UploadProgressInfo>({
    bytesTransferred: 0,
    totalBytes: 0,
    percentage: 0,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdDataset, setCreatedDataset] = useState<Dataset | null>(null);

  // Cancellation ref
  const cancelUploadRef = useRef<(() => void) | null>(null);

  const handleFileSelected = async (file: File) => {
    setErrorMessage(null);
    setSelectedFile(file);
    setUploadState('validating');

    // 1. Validation
    const validation = validateDatasetFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file format.');
      setUploadState('error');
      return;
    }

    // 2. Parsing preview
    try {
      setUploadState('parsing');
      const parsedPreview = await parseDatasetFile(file);
      setPreview(parsedPreview);
      setDatasetName(formatDatasetNameFromFileName(file.name));
      setUploadState('ready');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse the dataset preview.');
      setUploadState('error');
    }
  };

  const handleSheetChange = async (sheetName: string) => {
    if (!selectedFile) return;
    try {
      setUploadState('parsing');
      const parsedPreview = await parseDatasetFile(selectedFile, sheetName);
      setPreview(parsedPreview);
      setUploadState('ready');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to switch sheet.');
      setUploadState('error');
    }
  };

  const handleStartUpload = async () => {
    if (!selectedFile || !preview || !user) {
      setErrorMessage('User session or file preview is missing. Please log in.');
      setUploadState('error');
      return;
    }

    setUploadState('uploading');
    setProgress({ bytesTransferred: 0, totalBytes: selectedFile.size, percentage: 0 });

    const tempDatasetId = `dataset_${Date.now()}`;

    try {
      // 1. Upload file to Firebase Cloud Storage
      const { promise, cancel } = uploadDatasetFile(
        user.uid,
        tempDatasetId,
        selectedFile,
        (p) => setProgress(p)
      );

      cancelUploadRef.current = cancel;
      const uploadResult = await promise;

      // 2. Save metadata in Firestore
      const datasetRecord = await createDatasetMetadata({
        userId: user.uid,
        name: datasetName.trim() || formatDatasetNameFromFileName(selectedFile.name),
        originalFileName: selectedFile.name,
        fileType: preview.fileType,
        storagePath: uploadResult.storagePath,
        fileSize: selectedFile.size,
        rowCount: preview.rowCount,
        columnCount: preview.columnCount,
        selectedSheet: preview.selectedSheet || null,
        previewSample: {
          columns: preview.columns,
          rows: preview.sampleRows,
        },
      });

      setCreatedDataset(datasetRecord);
      setUploadState('success');
      if (onUploadComplete) {
        onUploadComplete(datasetRecord);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('cancelled')) {
        handleReset();
        return;
      }
      setErrorMessage(err.message || 'Failed to upload dataset. Please try again.');
      setUploadState('error');
    } finally {
      cancelUploadRef.current = null;
    }
  };

  const handleCancelUpload = () => {
    if (cancelUploadRef.current) {
      cancelUploadRef.current();
    }
    handleReset();
  };

  const handleReset = () => {
    setSelectedFile(null);
    setDatasetName('');
    setPreview(null);
    setErrorMessage(null);
    setCreatedDataset(null);
    setProgress({ bytesTransferred: 0, totalBytes: 0, percentage: 0 });
    setUploadState('idle');
  };

  return (
    <div className="w-full">
      {/* 1. Idle or Validating/Parsing State */}
      {(uploadState === 'idle' || uploadState === 'validating' || uploadState === 'parsing') && (
        <div className="space-y-4">
          <UploadDropzone
            onFileSelected={handleFileSelected}
            disabled={uploadState === 'validating' || uploadState === 'parsing'}
            errorMessage={errorMessage}
          />
          {(uploadState === 'validating' || uploadState === 'parsing') && (
            <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold animate-pulse">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600 animate-spin" />
              <span>Analyzing spreadsheet columns and rows...</span>
            </div>
          )}
        </div>
      )}

      {/* 2. File Preview & Confirmation State */}
      {uploadState === 'ready' && preview && (
        <FilePreview
          preview={preview}
          datasetName={datasetName}
          onDatasetNameChange={setDatasetName}
          onSheetChange={handleSheetChange}
          onConfirmUpload={handleStartUpload}
          onCancel={handleReset}
          isUploading={false}
        />
      )}

      {/* 3. Uploading Progress State */}
      {uploadState === 'uploading' && selectedFile && (
        <UploadProgress
          fileName={selectedFile.name}
          progress={progress}
          onCancel={handleCancelUpload}
        />
      )}

      {/* 4. Error State */}
      {uploadState === 'error' && (
        <UploadError
          errorMessage={errorMessage || 'An error occurred during dataset processing.'}
          onRetry={() => {
            if (selectedFile) {
              handleFileSelected(selectedFile);
            } else {
              handleReset();
            }
          }}
          onSelectAnother={handleReset}
        />
      )}

      {/* 5. Success State */}
      {uploadState === 'success' && createdDataset && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-emerald-200 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-xl font-extrabold text-slate-900">
              Dataset uploaded successfully!
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              <span className="font-bold text-slate-800">{createdDataset.name}</span> has been securely stored in your workspace and registered with <span className="font-bold text-indigo-600">{createdDataset.rowCount.toLocaleString()}</span> rows and <span className="font-bold text-indigo-600">{createdDataset.columnCount}</span> columns.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Another Dataset</span>
            </button>

            {onViewDataset && (
              <button
                type="button"
                onClick={() => onViewDataset(createdDataset.datasetId)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 group"
              >
                <span>View Dataset</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

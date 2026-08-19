import { Timestamp, FieldValue } from 'firebase/firestore';
import { ProfilingStatus } from './dataProfile';

export type FirestoreDate = Timestamp | FieldValue | Date | string;

export type DatasetFileType = 'csv' | 'xlsx' | 'xls';
export type DatasetStatus =
  | 'uploaded'
  | 'not_profiled'
  | 'profiling'
  | 'profiled'
  | 'failed'
  | 'processing'
  | 'ready';

export interface DatasetPreviewSample {
  columns: string[];
  rows: (string | number | boolean | null)[][];
}

export interface Dataset {
  datasetId: string;
  userId: string;
  name: string;
  originalFileName: string;
  fileType: DatasetFileType;
  storagePath: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
  selectedSheet: string | null;
  status: DatasetStatus;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
  previewSample?: DatasetPreviewSample;
  downloadUrl?: string;
  profileStatus?: ProfilingStatus;
  qualityScore?: number;
  profiledAt?: FirestoreDate;
}

export type UploadState =
  | 'idle'
  | 'validating'
  | 'parsing'
  | 'ready'
  | 'uploading'
  | 'success'
  | 'error';

export interface DatasetPreview {
  fileName: string;
  fileSize: number;
  fileType: DatasetFileType;
  rowCount: number;
  columnCount: number;
  columns: string[];
  sampleRows: (string | number | boolean | null)[][];
  availableSheets?: string[];
  selectedSheet?: string | null;
}

export interface UploadProgressInfo {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

export interface CreateDatasetInput {
  userId: string;
  name: string;
  originalFileName: string;
  fileType: DatasetFileType;
  storagePath: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
  selectedSheet: string | null;
  previewSample?: DatasetPreviewSample;
}

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
export const PREVIEW_ROW_LIMIT = 10;
export const ACCEPTED_EXTENSIONS: DatasetFileType[] = ['csv', 'xlsx', 'xls'];

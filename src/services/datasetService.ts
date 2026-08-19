import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Dataset, CreateDatasetInput } from '../types/dataset';
import { deleteDatasetFile } from './storageService';

const LOCAL_STORAGE_KEY_PREFIX = 'insightai_datasets_';

function generateDatasetId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `dataset_${timestamp}_${randomPart}`;
}

export function formatDatasetNameFromFileName(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  const base = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
  
  // Replace underscores and hyphens with spaces and capitalize words
  return base
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Creates Firestore metadata document in users/{userId}/datasets/{datasetId}
 */
export async function createDatasetMetadata(input: CreateDatasetInput): Promise<Dataset> {
  const datasetId = generateDatasetId();
  const now = new Date();

  const datasetData: Dataset = {
    datasetId,
    userId: input.userId,
    name: input.name.trim() || formatDatasetNameFromFileName(input.originalFileName),
    originalFileName: input.originalFileName,
    fileType: input.fileType,
    storagePath: input.storagePath,
    fileSize: input.fileSize,
    rowCount: input.rowCount,
    columnCount: input.columnCount,
    selectedSheet: input.selectedSheet || null,
    status: 'uploaded',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    previewSample: input.previewSample,
  };

  if (db) {
    try {
      const datasetRef = doc(db, 'users', input.userId, 'datasets', datasetId);
      await setDoc(datasetRef, {
        ...datasetData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.warn('Firestore setDoc failed, saving to local backup:', error);
      // Save locally as backup
      saveDatasetLocally(input.userId, datasetData);
    }
  } else {
    saveDatasetLocally(input.userId, datasetData);
  }

  return datasetData;
}

/**
 * Fetches all datasets for the authenticated user
 */
export async function getDatasets(userId: string): Promise<Dataset[]> {
  if (!userId) return [];

  if (db) {
    try {
      const datasetsRef = collection(db, 'users', userId, 'datasets');
      const q = query(datasetsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const datasets: Dataset[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          datasets.push({
            datasetId: docSnap.id,
            userId: data.userId || userId,
            name: data.name || 'Untitled Dataset',
            originalFileName: data.originalFileName || '',
            fileType: data.fileType || 'csv',
            storagePath: data.storagePath || '',
            fileSize: data.fileSize || 0,
            rowCount: data.rowCount || 0,
            columnCount: data.columnCount || 0,
            selectedSheet: data.selectedSheet || null,
            status: data.status || 'uploaded',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data.updatedAt || new Date().toISOString()),
            previewSample: data.previewSample,
            downloadUrl: data.downloadUrl,
          });
        });
        return datasets;
      }
    } catch (error: any) {
      console.warn('Firestore getDatasets error, reading local fallback:', error);
    }
  }

  return getDatasetsLocally(userId);
}

/**
 * Fetches a single dataset by ID for the authenticated user
 */
export async function getDataset(userId: string, datasetId: string): Promise<Dataset | null> {
  if (!userId || !datasetId) return null;

  if (db) {
    try {
      const docRef = doc(db, 'users', userId, 'datasets', datasetId);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        return {
          datasetId: snapshot.id,
          userId: data.userId || userId,
          name: data.name || 'Untitled Dataset',
          originalFileName: data.originalFileName || '',
          fileType: data.fileType || 'csv',
          storagePath: data.storagePath || '',
          fileSize: data.fileSize || 0,
          rowCount: data.rowCount || 0,
          columnCount: data.columnCount || 0,
          selectedSheet: data.selectedSheet || null,
          status: data.status || 'uploaded',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data.updatedAt || new Date().toISOString()),
          previewSample: data.previewSample,
          downloadUrl: data.downloadUrl,
        };
      }
    } catch (error: any) {
      console.warn('Firestore getDataset error, reading local fallback:', error);
    }
  }

  const localDatasets = getDatasetsLocally(userId);
  return localDatasets.find((d) => d.datasetId === datasetId) || null;
}

/**
 * Updates the user-friendly name of the dataset
 */
export async function updateDatasetName(
  userId: string,
  datasetId: string,
  newName: string
): Promise<void> {
  if (!userId || !datasetId) throw new Error('User ID and Dataset ID are required.');
  const trimmed = newName.trim();
  if (!trimmed) throw new Error('Dataset name cannot be empty.');

  if (db) {
    try {
      const docRef = doc(db, 'users', userId, 'datasets', datasetId);
      await updateDoc(docRef, {
        name: trimmed,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.warn('Firestore updateDatasetName failed, updating local copy:', error);
      updateDatasetLocally(userId, datasetId, { name: trimmed, updatedAt: new Date().toISOString() });
      return;
    }
  }

  updateDatasetLocally(userId, datasetId, { name: trimmed, updatedAt: new Date().toISOString() });
}

/**
 * Complete deletion: removes Firebase Storage object first, then Firestore metadata record
 */
export async function deleteDataset(
  userId: string,
  datasetId: string,
  storagePath: string
): Promise<void> {
  if (!userId || !datasetId) throw new Error('Missing required user or dataset identifiers.');

  // 1. Delete physical file in Cloud Storage
  if (storagePath) {
    try {
      await deleteDatasetFile(storagePath);
    } catch (error: any) {
      console.warn('Cloud Storage deletion notice:', error);
      // We still attempt to delete metadata if storage object was missing or already removed
    }
  }

  // 2. Delete Firestore document
  if (db) {
    try {
      const docRef = doc(db, 'users', userId, 'datasets', datasetId);
      await deleteDoc(docRef);
    } catch (error: any) {
      console.error('Failed to delete Firestore dataset document:', error);
      throw new Error(`Failed to remove dataset record: ${error.message || 'Database error'}`);
    }
  }

  // 3. Remove local cache copy if present
  deleteDatasetLocally(userId, datasetId);
}

// Local Storage Helper Fallbacks (for robust offline or demo handling)

function getDatasetsLocally(userId: string): Dataset[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveDatasetLocally(userId: string, dataset: Dataset): void {
  try {
    const existing = getDatasetsLocally(userId);
    const updated = [dataset, ...existing.filter((d) => d.datasetId !== dataset.datasetId)];
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save dataset locally', e);
  }
}

function updateDatasetLocally(userId: string, datasetId: string, updates: Partial<Dataset>): void {
  try {
    const existing = getDatasetsLocally(userId);
    const updated = existing.map((d) => (d.datasetId === datasetId ? { ...d, ...updates } : d));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to update dataset locally', e);
  }
}

function deleteDatasetLocally(userId: string, datasetId: string): void {
  try {
    const existing = getDatasetsLocally(userId);
    const filtered = existing.filter((d) => d.datasetId !== datasetId);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to delete dataset locally', e);
  }
}

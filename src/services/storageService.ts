import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTask,
} from 'firebase/storage';
import { storage } from '../lib/firebase';
import { UploadProgressInfo } from '../types/dataset';

/**
 * Sanitizes a user-provided file name to prevent directory traversal or invalid storage paths
 */
export function sanitizeFileName(originalName: string): string {
  // Extract extension
  const lastDotIndex = originalName.lastIndexOf('.');
  const ext = lastDotIndex !== -1 ? originalName.substring(lastDotIndex).toLowerCase() : '';
  const baseName = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;

  // Clean base name: keep alphanumeric, hyphens, and underscores
  const cleanBase = baseName
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[-\s]+/g, '_');

  const finalBase = cleanBase.length > 0 ? cleanBase : 'dataset';
  return `${finalBase}${ext}`;
}

export interface UploadResult {
  storagePath: string;
  downloadUrl?: string;
  task?: UploadTask;
}

/**
 * Uploads a dataset file to Firebase Cloud Storage at users/{uid}/datasets/{datasetId}/{safeFileName}
 * Supports real-time progress callbacks and task cancellation.
 */
export function uploadDatasetFile(
  userId: string,
  datasetId: string,
  file: File,
  onProgress?: (progress: UploadProgressInfo) => void
): { promise: Promise<UploadResult>; cancel: () => void } {
  const safeName = sanitizeFileName(file.name);
  const storagePath = `users/${userId}/datasets/${datasetId}/${safeName}`;

  if (!storage) {
    // If Firebase Storage is not initialized, return a graceful mock upload for development
    let cancelled = false;
    let progressTimer: NodeJS.Timeout;

    const promise = new Promise<UploadResult>((resolve, reject) => {
      let currentProgress = 0;
      const totalBytes = file.size;

      progressTimer = setInterval(() => {
        if (cancelled) {
          clearInterval(progressTimer);
          reject(new Error('Upload was cancelled by user.'));
          return;
        }

        currentProgress += Math.min(totalBytes * 0.25, totalBytes - currentProgress);
        const pct = Math.min(100, Math.round((currentProgress / totalBytes) * 100));

        if (onProgress) {
          onProgress({
            bytesTransferred: currentProgress,
            totalBytes: totalBytes,
            percentage: pct,
          });
        }

        if (currentProgress >= totalBytes) {
          clearInterval(progressTimer);
          resolve({
            storagePath,
            downloadUrl: URL.createObjectURL(file),
          });
        }
      }, 150);
    });

    return {
      promise,
      cancel: () => {
        cancelled = true;
        clearInterval(progressTimer);
      },
    };
  }

  // Real Firebase Storage upload
  const storageRef = ref(storage, storagePath);
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type || 'application/octet-stream',
    customMetadata: {
      originalFileName: file.name,
      userId,
      datasetId,
    },
  });

  const promise = new Promise<UploadResult>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const bytesTransferred = snapshot.bytesTransferred;
        const totalBytes = snapshot.totalBytes;
        const percentage = totalBytes > 0 ? Math.round((bytesTransferred / totalBytes) * 100) : 0;

        if (onProgress) {
          onProgress({
            bytesTransferred,
            totalBytes,
            percentage,
          });
        }
      },
      (error) => {
        // Handle human-readable Firebase Storage error codes
        if (error.code === 'storage/canceled') {
          reject(new Error('Upload was cancelled.'));
        } else if (error.code === 'storage/unauthorized') {
          reject(new Error('Permission denied. Please verify your authentication status.'));
        } else if (error.code === 'storage/quota-exceeded') {
          reject(new Error('Storage quota exceeded. Please contact support.'));
        } else {
          reject(new Error(error.message || 'File upload failed due to a network error.'));
        }
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            storagePath,
            downloadUrl,
            task: uploadTask,
          });
        } catch {
          // In case download URL cannot be retrieved due to rules, resolve storagePath
          resolve({
            storagePath,
            task: uploadTask,
          });
        }
      }
    );
  });

  return {
    promise,
    cancel: () => {
      uploadTask.cancel();
    },
  };
}

/**
 * Deletes a dataset file from Firebase Cloud Storage
 */
export async function deleteDatasetFile(storagePath: string): Promise<void> {
  if (!storage || !storagePath) return;

  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (error: any) {
    // If file already removed or not found (404), log and proceed
    if (error?.code === 'storage/object-not-found') {
      console.warn('Storage file not found during deletion, continuing.');
      return;
    }
    throw error;
  }
}

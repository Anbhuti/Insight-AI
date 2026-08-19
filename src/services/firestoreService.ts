import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  DocumentData,
  SnapshotOptions,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, auth, isFirebaseConfigured } from '../lib/firebase';
import { UserProfile } from '../types/database';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(errInfo.error);
}

/**
 * Creates a brand new user profile document in Firestore at users/{uid}
 */
export async function createUserProfile(
  user: User,
  additionalData?: { displayName?: string }
): Promise<UserProfile> {
  if (!db || !isFirebaseConfigured()) {
    return {
      uid: user.uid,
      displayName: additionalData?.displayName || user.displayName || 'User',
      email: user.email,
      photoURL: user.photoURL,
      provider: user.providerData?.[0]?.providerId || 'password',
      role: 'user',
      plan: 'free',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
  }

  const userDocRef = doc(db, 'users', user.uid);
  const path = `users/${user.uid}`;

  const displayName = additionalData?.displayName?.trim() || user.displayName?.trim() || null;
  const provider = user.providerData?.[0]?.providerId || 'password';

  const newProfileData = {
    uid: user.uid,
    displayName: displayName,
    email: user.email || null,
    photoURL: user.photoURL || null,
    provider: provider,
    role: 'user',
    plan: 'free',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  };

  try {
    await setDoc(userDocRef, newProfileData);
    return {
      ...newProfileData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    } as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Fetches the user profile document from Firestore at users/{uid}
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db || !isFirebaseConfigured()) {
    return null;
  }

  const userDocRef = doc(db, 'users', uid);
  const path = `users/${uid}`;

  try {
    const snapshot = await getDoc(userDocRef);
    if (!snapshot.exists()) {
      return null;
    }
    const data = snapshot.data();
    return {
      uid: data.uid || uid,
      displayName: data.displayName || null,
      email: data.email || null,
      photoURL: data.photoURL || null,
      provider: data.provider || 'password',
      role: data.role || 'user',
      plan: data.plan || 'free',
      createdAt: data.createdAt || null,
      updatedAt: data.updatedAt || null,
      lastLoginAt: data.lastLoginAt || null,
    } as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Updates non-protected user profile fields in Firestore at users/{uid}
 */
export async function updateUserProfile(
  uid: string,
  data: Partial<Pick<UserProfile, 'displayName' | 'photoURL'>>
): Promise<void> {
  if (!db || !isFirebaseConfigured()) {
    return;
  }

  const userDocRef = doc(db, 'users', uid);
  const path = `users/${uid}`;

  try {
    await updateDoc(userDocRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Updates the lastLoginAt timestamp on login
 */
export async function updateUserLastLogin(uid: string): Promise<void> {
  if (!db || !isFirebaseConfigured()) {
    return;
  }

  const userDocRef = doc(db, 'users', uid);
  const path = `users/${uid}`;

  try {
    await updateDoc(userDocRef, {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    // If the doc doesn't exist yet (e.g. legacy user), we will catch or create in sync
    console.warn(`Could not update lastLoginAt for ${uid}:`, error);
  }
}

/**
 * Synchronizes user authentication with Firestore:
 * - Checks if users/{uid} exists.
 * - If not, creates it.
 * - If yes, updates lastLoginAt and latest auth meta (e.g. photoURL or displayName if empty).
 */
export async function syncUserAuthProfile(
  user: User,
  additionalName?: string
): Promise<UserProfile> {
  if (!db || !isFirebaseConfigured()) {
    return {
      uid: user.uid,
      displayName: additionalName || user.displayName || 'User',
      email: user.email,
      photoURL: user.photoURL,
      provider: user.providerData?.[0]?.providerId || 'password',
      role: 'user',
      plan: 'free',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
  }

  try {
    const existing = await getUserProfile(user.uid);
    if (!existing) {
      return await createUserProfile(user, { displayName: additionalName });
    }

    // Update lastLoginAt
    await updateUserLastLogin(user.uid);
    return {
      ...existing,
      displayName: existing.displayName || user.displayName || additionalName || null,
      photoURL: existing.photoURL || user.photoURL || null,
    };
  } catch (error) {
    console.error('Error synchronizing user auth profile:', error);
    throw error;
  }
}

/**
 * Retrieves the current logged-in user's Firestore profile
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  if (!auth?.currentUser) {
    return null;
  }
  return await getUserProfile(auth.currentUser.uid);
}

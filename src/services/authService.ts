import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  UserCredential,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';

export function getFriendlyErrorMessage(error: any): string {
  if (!error) return 'Something went wrong. Please try again.';

  const code = typeof error === 'string' ? error : error.code || '';
  const message = error.message || '';

  if (!isFirebaseConfigured()) {
    return 'Firebase credentials are not configured yet. Please add your Firebase settings to environment variables.';
  }

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'The email or password is incorrect.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Please choose a stronger password (at least 8 characters).';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/network-request-failed':
      return 'Something went wrong. Please check your connection and try again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled before completion.';
    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Please wait a few moments and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled in your Firebase Console. Please enable Email/Password or Google provider.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in your Firebase Auth settings. Add it in Firebase Console > Authentication > Settings > Authorized domains.';
    default:
      if (message.includes('auth/invalid-credential')) {
        return 'The email or password is incorrect.';
      }
      return 'Something went wrong. Please try again.';
  }
}

export async function loginWithEmail(email: string, password: string): Promise<UserCredential> {
  if (!auth) {
    throw new Error(getFriendlyErrorMessage('auth/configuration-not-found'));
  }
  try {
    return await signInWithEmailAndPassword(auth, email.trim(), password);
  } catch (error: any) {
    throw new Error(getFriendlyErrorMessage(error));
  }
}

export async function signupWithEmail(
  email: string,
  password: string,
  fullName?: string
): Promise<UserCredential> {
  if (!auth) {
    throw new Error(getFriendlyErrorMessage('auth/configuration-not-found'));
  }
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (fullName && cred.user) {
      await updateProfile(cred.user, { displayName: fullName.trim() });
    }
    return cred;
  } catch (error: any) {
    throw new Error(getFriendlyErrorMessage(error));
  }
}

export async function loginWithGoogle(): Promise<UserCredential> {
  if (!auth) {
    throw new Error(getFriendlyErrorMessage('auth/configuration-not-found'));
  }
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    throw new Error(getFriendlyErrorMessage(error));
  }
}

export async function logoutUser(): Promise<void> {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(getFriendlyErrorMessage(error));
  }
}

export async function resetPassword(email: string): Promise<void> {
  if (!auth) {
    throw new Error(getFriendlyErrorMessage('auth/configuration-not-found'));
  }
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error: any) {
    // For security and per instructions: Do not reveal whether an email is registered
    // But surface network errors
    if (error?.code === 'auth/network-request-failed') {
      throw new Error(getFriendlyErrorMessage(error));
    }
  }
}

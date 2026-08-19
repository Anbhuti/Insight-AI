import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import { UserProfile } from '../types/database';
import {
  loginWithEmail,
  signupWithEmail,
  loginWithGoogle,
  logoutUser,
  resetPassword,
} from '../services/authService';
import {
  getUserProfile,
  syncUserAuthProfile,
} from '../services/firestoreService';

export interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  profileError: string | null;
  isConfigured: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const configured = isFirebaseConfigured();

  const loadUserProfile = useCallback(async (firebaseUser: User | null, preferredName?: string) => {
    if (!firebaseUser) {
      setUserProfile(null);
      setProfileLoading(false);
      setProfileError(null);
      return;
    }

    setProfileLoading(true);
    setProfileError(null);
    try {
      const profile = await syncUserAuthProfile(firebaseUser, preferredName);
      setUserProfile(profile);
    } catch (err: unknown) {
      console.error('Failed to load user profile from Firestore:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to retrieve user profile from Firestore.';
      setProfileError(errMsg);
      // Fallback profile representation from Auth object so user is not blocked
      setUserProfile({
        uid: firebaseUser.uid,
        displayName: preferredName || firebaseUser.displayName || null,
        email: firebaseUser.email || null,
        photoURL: firebaseUser.photoURL || null,
        provider: firebaseUser.providerData?.[0]?.providerId || 'password',
        role: 'user',
        plan: 'free',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      });
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    setProfileLoading(true);
    setProfileError(null);
    try {
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setUserProfile(profile);
      }
    } catch (err: unknown) {
      console.error('Failed to refresh user profile:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to refresh profile.';
      setProfileError(errMsg);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!configured || !auth) {
      setUser(null);
      setUserProfile(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);
        setLoading(false);
        if (currentUser) {
          await loadUserProfile(currentUser);
        } else {
          setUserProfile(null);
        }
      },
      (error) => {
        console.warn('Auth state change error:', error);
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [configured, loadUserProfile]);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const cred = await loginWithEmail(email, password);
      setUser(cred.user);
      await loadUserProfile(cred.user);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (email: string, password: string, fullName?: string) => {
    setLoading(true);
    try {
      const cred = await signupWithEmail(email, password, fullName);
      setUser(cred.user);
      await loadUserProfile(cred.user, fullName);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithGoogle = async () => {
    setLoading(true);
    try {
      const cred = await loginWithGoogle();
      setUser(cred.user);
      await loadUserProfile(cred.user);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setUser(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    await resetPassword(email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        profileLoading,
        profileError,
        isConfigured: configured,
        login: handleLogin,
        signup: handleSignup,
        loginWithGoogle: handleLoginWithGoogle,
        logout: handleLogout,
        resetPassword: handleResetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { API_BASE_URL } from '../config.ts';
import { AppUser } from '../types.ts';

interface AuthContextType {
  user: User | null;
  dbUser: AppUser | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDbUser = async (idToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setDbUser(data.user);
        } else {
          setDbUser(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch user profile from DB:', err);
    }
  };

  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          console.log('[ANDROID AUTH SUCCESS]', {
            email: result.user.email,
            uid: result.user.uid,
            providerId: result.providerId,
          });
          const idToken = await result.user.getIdToken();
          setToken(idToken);
          await fetchDbUser(idToken);
        } else {
          console.log('[ANDROID AUTH DEBUG] getRedirectResult returned null (no pending redirect auth flow)');
        }
      })
      .catch((err) => {
        console.error('[ANDROID AUTH REDIRECT ERROR]', {
          code: err?.code,
          message: err?.message,
          customData: err?.customData,
          name: err?.name,
        });
      });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken();
          setToken(idToken);
          await fetchDbUser(idToken);
        } catch (err) {
          console.error('Failed to get token:', err);
        }
      } else {
        setToken(null);
        setDbUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const isCapacitor = typeof window !== 'undefined' && (
        (window as any).Capacitor !== undefined ||
        window.location.origin.startsWith('capacitor://') ||
        window.location.origin.includes('localhost') ||
        window.location.protocol === 'file:'
      );

      console.log('[ANDROID AUTH START]', {
        isCapacitor,
        origin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
        href: typeof window !== 'undefined' ? window.location.href : 'N/A',
        authDomain: auth.config.authDomain,
        appName: auth.app.name,
      });

      if (isCapacitor) {
        // Try popup first or redirect based on WebView behavior
        try {
          console.log('[ANDROID AUTH] Attempting signInWithPopup on Capacitor...');
          const res = await signInWithPopup(auth, googleAuthProvider);
          if (res.user) {
            console.log('[ANDROID AUTH POPUP SUCCESS]', { email: res.user.email, uid: res.user.uid });
            const idToken = await res.user.getIdToken();
            setToken(idToken);
            await fetchDbUser(idToken);
            return;
          }
        } catch (popupErr: any) {
          console.warn('[ANDROID AUTH POPUP FAILED]', {
            code: popupErr?.code,
            message: popupErr?.message,
            customData: popupErr?.customData,
          });
          console.log('[ANDROID AUTH] Falling back to signInWithRedirect...');
          await signInWithRedirect(auth, googleAuthProvider);
        }
      } else {
        try {
          const res = await signInWithPopup(auth, googleAuthProvider);
          if (res.user) {
            const idToken = await res.user.getIdToken();
            setToken(idToken);
            await fetchDbUser(idToken);
          }
        } catch (popupErr: any) {
          console.warn('[WEB AUTH POPUP FAILED]', {
            code: popupErr?.code,
            message: popupErr?.message,
          });
          if (
            popupErr?.code === 'auth/popup-blocked' ||
            popupErr?.code === 'auth/operation-not-supported-in-this-environment' ||
            popupErr?.code === 'auth/popup-closed-by-user' ||
            popupErr?.code === 'auth/cancelled-popup-request'
          ) {
            await signInWithRedirect(auth, googleAuthProvider);
          } else {
            throw popupErr;
          }
        }
      }
    } catch (err: any) {
      console.error('[ANDROID AUTH ERROR]', {
        code: err?.code,
        message: err?.message,
        customData: err?.customData,
        fullError: err,
      });
      alert(`فشل تسجيل الدخول: ${err?.code ? `[${err.code}] ` : ''}${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setToken(null);
      setDbUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const refreshUserProfile = async () => {
    if (token) {
      await fetchDbUser(token);
    }
  };

  const isAdmin = dbUser?.role === 'owner' || dbUser?.role === 'admin';
  const isOwner = dbUser?.role === 'owner';

  return (
    <AuthContext.Provider
      value={{
        user,
        dbUser,
        token,
        loading,
        isAdmin,
        isOwner,
        signInWithGoogle,
        signOutUser,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

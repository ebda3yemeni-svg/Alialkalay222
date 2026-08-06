import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
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
      const res = await fetch('/api/auth/me', {
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
      const res = await signInWithPopup(auth, googleAuthProvider);
      if (res.user) {
        const idToken = await res.user.getIdToken();
        setToken(idToken);
        await fetchDbUser(idToken);
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      alert(`فشل تسجيل الدخول: ${err.message || err}`);
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

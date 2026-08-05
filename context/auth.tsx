import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { auth } from '@/FirebaseConfig';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  logIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // null means firebase has not found a saved user yet
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // firebase calls this when a user logs in, logs out or restores a saved session
  useEffect(() => {
    const stopListening = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return stopListening;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      logIn: async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      signUp: async (email: string, password: string) => {
        await createUserWithEmailAndPassword(auth, email, password);
      },
      logOut: async () => {
        await signOut(auth);
      },
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return value;
}

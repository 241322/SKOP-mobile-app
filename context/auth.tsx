import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { auth } from '@/FirebaseConfig';
import { deleteFirestoreUserData } from '@/lib/skop-firestore';

type AuthContextValue = {
  user: User | null;
  emailVerified: boolean;
  loading: boolean;
  logIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  refreshEmailVerification: () => Promise<boolean>;
  resendEmailVerification: () => Promise<void>;
  logOut: () => Promise<void>;
  sendPasswordReset: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // null means firebase has not found a saved user yet
  const [user, setUser] = useState<User | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  // firebase calls this when a user logs in, logs out or restores a saved session
  useEffect(() => {
    const stopListening = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setEmailVerified(Boolean(nextUser?.emailVerified));
      setLoading(false);
    });

    return stopListening;
  }, []);

  const value = useMemo(
    () => ({
      user,
      emailVerified,
      loading,
      logIn: async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      signUp: async (email: string, password: string) => {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(credential.user);
        setEmailVerified(false);
      },
      refreshEmailVerification: async () => {
        if (!auth.currentUser) return false;

        // reload asks firebase for the latest verification state
        await reload(auth.currentUser);
        const verified = auth.currentUser.emailVerified;
        setEmailVerified(verified);
        return verified;
      },
      resendEmailVerification: async () => {
        if (!auth.currentUser) throw new Error('There is no signed-in account.');
        await sendEmailVerification(auth.currentUser);
      },
      logOut: async () => {
        await signOut(auth);
      },
      sendPasswordReset: async () => {
        if (!user?.email) throw new Error('The signed-in account has no email address.');
        await sendPasswordResetEmail(auth, user.email);
      },
      deleteAccount: async (password: string) => {
        if (!user?.email) throw new Error('The signed-in account has no email address.');
        const userId = user.uid;
        const credential = EmailAuthProvider.credential(user.email, password);

        await reauthenticateWithCredential(user, credential);
        await deleteFirestoreUserData(userId);
        await AsyncStorage.multiRemove([
          `quit-plan-${userId}`,
          `quit-plan-pending-${userId}`,
          `skop-sessions-${userId}`,
          `skop-spend-check-ins-${userId}`,
        ]);
        await deleteUser(user);
      },
    }),
    [emailVerified, loading, user]
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

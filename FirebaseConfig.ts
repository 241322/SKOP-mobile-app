import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import type { Persistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// connects the app to the skop firebase project
const firebaseConfig = {
  apiKey: "AIzaSyAS8ojREjWjVvj9HhRqYeCyYQo6ld4rnd0",
  authDomain: "skop-4effb.firebaseapp.com",
  projectId: "skop-4effb",
  storageBucket: "skop-4effb.firebasestorage.app",
  messagingSenderId: "331039984772",
  appId: "1:331039984772:web:9f87b4ac7527a59a8c86d1"
};

// gives firebase auth its own storage on the phone
const authStorage = createAsyncStorage('skop-auth');

// adds the native export missing from firebase's shared type file
const nativeAuth = FirebaseAuth as typeof FirebaseAuth & {
  getReactNativePersistence: (storage: typeof authStorage) => Persistence;
};

// uses phone storage in expo go and browser storage on web
const authPersistence =
  Platform.OS === 'web'
    ? FirebaseAuth.browserLocalPersistence
    : nativeAuth.getReactNativePersistence(authStorage);

// starts each firebase service once
export const app = initializeApp(firebaseConfig);
export const auth = FirebaseAuth.initializeAuth(app, {
  persistence: authPersistence,
});
export const db = getFirestore(app);

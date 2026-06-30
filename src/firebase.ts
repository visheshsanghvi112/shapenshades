
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase project credentials for Shapes & Shades
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if Firebase is actually configured with valid environment variables
export let isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY' &&
  !firebaseConfig.apiKey.startsWith('YOUR_')
);

export let app: FirebaseApp;
export let auth: Auth;
export let db: Firestore;
export let storage: FirebaseStorage;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (err) {
    console.error('Failed to initialize Firebase:', err);
    // Force configuration status to false if initialization failed
    isFirebaseConfigured = false;
  }
} else {
  console.warn('Firebase is not configured. Running in local/dev-bypass mode.');
  // Set mock/dummy variables to prevent runtime crashes on imports
  app = null as any;
  auth = null as any;
  db = null as any;
  storage = null as any;
}

let analytics: any = null;

export const initAnalytics = async () => {
  if (isFirebaseConfigured && app && !analytics && (await isSupported())) {
    try {
      analytics = getAnalytics(app);
    } catch (err) {
      console.warn('Failed to initialize Firebase Analytics:', err);
    }
  }
  return analytics;
};

export const getAnalyticsInstance = () => analytics;

export default app;


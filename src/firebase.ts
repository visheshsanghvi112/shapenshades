import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase project credentials for Shapes & Shades
const firebaseConfig = {
  apiKey: "AIzaSyBSULRps4GYC8XRi-tqKUMhYzfWPe9VNFc",
  authDomain: "shapenshades-74d41.firebaseapp.com",
  projectId: "shapenshades-74d41",
  storageBucket: "shapenshades-74d41.firebasestorage.app",
  messagingSenderId: "1025632982903",
  appId: "1:1025632982903:web:ba6ba67575316b3cae3372",
  measurementId: "G-QY0X7QKVYE"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

let analytics: any = null;

export const initAnalytics = async () => {
  if (!analytics && (await isSupported())) {
    analytics = getAnalytics(app);
  }
  return analytics;
};

export const getAnalyticsInstance = () => analytics;

export const isFirebaseConfigured = Object.values(firebaseConfig).every((value) => {
  return typeof value === 'string' ? !value.startsWith('YOUR_') : true;
});

export default app;

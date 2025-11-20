// Import Firebase SDK
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDp3h-P4NhHH1hM-ijVkZRrLS0BR6X-K1M",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "form-sevice.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "form-sevice",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "form-sevice.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "947490221653",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:947490221653:web:a04484feb7feeed9bf6edc",
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID || "G-MR5Z7T7R6T",
};

// ✅ Inisialisasi hanya sekali (hindari duplikasi)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();


// Ekspor instance tunggal
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

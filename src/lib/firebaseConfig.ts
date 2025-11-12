// Import Firebase SDK
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDp3h-P4NhHH1hM-ijVkZRrLS0BR6X-K1M",
  authDomain: "form-sevice.firebaseapp.com",
  projectId: "form-sevice",
  storageBucket: "form-sevice.appspot.com",
  messagingSenderId: "947490221653",
  appId: "1:947490221653:web:a04484feb7feeed9bf6edc",
  measurementId: "G-MR5Z7T7R6T",
};

// ✅ Inisialisasi hanya sekali (hindari duplikasi)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();


// Ekspor instance tunggal
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

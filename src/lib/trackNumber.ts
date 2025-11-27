// ✅ src/lib/trackNumber.ts
import { db } from "./firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

// Fungsi generate nomor tracking tanpa index Firestore
export const generateTrackNumber = async (): Promise<string> => {
  // Single global prefix (no cabang)
  const prefix = "TNS";

  // Ambil semua dokumen service_requests untuk menghitung jumlah
  const q = query(collection(db, "service_requests"));
  const querySnapshot = await getDocs(q);

  const totalDocs = querySnapshot.size;
  const newNumber = totalDocs + 1;

  // Return format nomor tracking baru
  return `${prefix}-${String(newNumber).padStart(5, "0")}`;
};

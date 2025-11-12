// ✅ src/lib/trackNumber.ts
import { db } from "./firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

// Fungsi generate nomor tracking tanpa index Firestore
export const generateTrackNumber = async (cabang: string): Promise<string> => {
  // Tentukan prefix berdasarkan cabang
  const prefix = cabang === "Alifcyber Solution" ? "ACS" : "HC";

  // Ambil semua dokumen dengan cabang yang sama (tanpa orderBy)
  const q = query(collection(db, "service_requests"), where("cabang", "==", cabang));
  const querySnapshot = await getDocs(q);

  // Hitung total dokumen di cabang itu
  const totalDocs = querySnapshot.size;
  const newNumber = totalDocs + 1;

  // Return format nomor tracking baru
  return `${prefix}-TNS${newNumber}`;
};

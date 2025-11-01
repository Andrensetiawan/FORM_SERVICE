import { db } from "@/lib/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export async function logActivity(userId: string, action: string, detail?: string) {
  try {
    await addDoc(collection(db, "activity_logs"), {
      userId,
      action,
      detail: detail || "",
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Gagal mencatat aktivitas:", error);
  }
}

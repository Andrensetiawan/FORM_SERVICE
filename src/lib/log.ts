import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { UserRole } from "@/lib/roles";

export interface LogEntry {
  uid: string;
  role: UserRole | "unknown";
  action: string;
  target?: string | null;
  detail?: any;
}

export async function createLog(entry: LogEntry) {
  try {
    await addDoc(collection(db, "logs"), {
      ...entry,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to create log:", err);
  }
}

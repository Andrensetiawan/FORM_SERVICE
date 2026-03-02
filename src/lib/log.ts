import { auth, db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { UserRole } from "@/lib/roles";

export interface LogEntry {
  uid: string;
  email?: string;
  role: UserRole | "unknown";
  action: string;
  target?: string | null;
  detail?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function createLog(entry: LogEntry) {
  try {
    const currentUser = auth.currentUser;

    await addDoc(collection(db, "logs"), {
      uid: entry.uid || currentUser?.uid || "unknown",
      email: entry.email ?? currentUser?.email ?? undefined,
      userAgent:
        entry.userAgent ??
        (typeof navigator !== "undefined" ? navigator.userAgent : undefined),
      ...entry,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to create log:", err);
  }
}

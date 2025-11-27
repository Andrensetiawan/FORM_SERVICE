import { db } from "./firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function createLog({
  uid,
  role,
  action,
  target = "",
  detail = {},
}: {
  uid: string;
  role: string;
  action: string;
  target?: string;
  detail?: any;
}) {
  try {
    await addDoc(collection(db, "logs"), {
      uid,
      role,
      action,
      target,
      detail,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to create log:", err);
  }
}

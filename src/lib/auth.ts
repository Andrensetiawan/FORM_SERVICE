// src/lib/auth.ts
import { auth, db } from "./firebaseConfig";
import { GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const user = credential.user;
  // ensure role doc exists
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    // default role: staff? atau customer? -> set sesuai kebijakan
    await setDoc(userRef, { role: "pending", twoFactorEnabled: false }, { merge: true });
  }
  return user;
}

export async function signOut() {
  await fbSignOut(auth);
}

export async function getUserRole(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data().role;
}

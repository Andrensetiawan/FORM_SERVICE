"use client";

import { useState, useEffect, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  User,
} from "firebase/auth";

import { auth, db } from "@/lib/firebaseConfig";
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";

import toast from "react-hot-toast";
import { createLog } from "@/lib/log";
import { ROLES, UserRole } from "@/lib/roles";
import { isRoleRequiringApproval } from "@/lib/roleHelpers";

// ==================================================
// Ambil dokumen user berdasarkan UID
// ==================================================
const fetchUserDoc = async (uid: string) => {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (snap.exists()) return { id: snap.id, data: snap.data() as any };

    const q = query(collection(db, "users"), where("uid", "==", uid));
    const qSnap = await getDocs(q);

    if (!qSnap.empty) {
      const d = qSnap.docs[0];
      return { id: d.id, data: d.data() as any };
    }

    return null;
  } catch (err) {
    console.error("fetchUserDoc error:", err);
    return null;
  }
};

// ==================================================
// Main Hook
// ==================================================
export default function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }

    const userDoc = await fetchUserDoc(currentUser.uid);
    if (!userDoc) {
      toast.error("User tidak ditemukan.");
      await signOut(auth);
      setLoading(false);
      return;
    }

    const data = userDoc.data;
    const userRole = (data.role as string).toLowerCase() as UserRole;

    if (!Object.values(ROLES).includes(userRole)) {
      toast.error("Role user tidak valid.");
      await signOut(auth);
      setLoading(false);
      return;
    }

    if (isRoleRequiringApproval(userRole) && data.approved === false) {
      toast.error("Akun belum di-approve.");
      await signOut(auth);
      setLoading(false);
      return;
    }

    if (userRole === ROLES.CUSTOMER) {
      setUser(null);
      setRole(ROLES.CUSTOMER);
      setLoading(false);
      return;
    }

    setUser(currentUser);
    setRole(userRole);

    updateDoc(doc(db, "users", currentUser.uid), {
      online: true,
      lastActive: serverTimestamp(),
    }).catch(() => {});

    window.addEventListener("beforeunload", () => {
      updateDoc(doc(db, "users", currentUser.uid), {
        online: false,
        lastActive: serverTimestamp(),
      }).catch(() => {});
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, loadUser);
    return () => unsub();
  }, [loadUser]);

  // LOGIN
  const login = async (email: string, password: string) => {
    setLoading(true);

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const u = result.user;

      if (!u.emailVerified) {
        toast.error("Email belum diverifikasi.");
        await signOut(auth);
        return null;
      }

      const userDoc = await fetchUserDoc(u.uid);
      if (!userDoc) return null;

      const userRole = userDoc.data.role as UserRole;

      if (isRoleRequiringApproval(userRole) && userDoc.data.approved === false) {
        toast.error("Akun belum di-approve.");
        await signOut(auth);
        return null;
      }

      toast.success("Login berhasil!");

      createLog({
        uid: u.uid,
        role: userRole,
        action: "login",
        target: email,
      });

      const redirect =
        userRole === ROLES.ADMIN
          ? "/admin"
          : userRole === ROLES.OWNER
          ? "/owner"
          : userRole === ROLES.MANAGER
          ? "/manager"
          : "/staff";

      window.location.href = redirect;
      return u;
    } catch (err) {
      console.error(err);
      toast.error("Login gagal.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // REGISTER DEFAULT: STAFF PENDING
  const register = async (
    email: string,
    password: string,
    confirmPassword: string
  ) => {
    if (password !== confirmPassword)
      return toast.error("Password tidak cocok!");

    setLoading(true);

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = result.user;

      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        email: newUser.email,
        role: ROLES.STAFF,
        approved: false,
        online: false,
        createdAt: serverTimestamp(),
      });

      await sendEmailVerification(newUser);
      toast.success("Akun dibuat! Cek email verifikasi.");
      return newUser;
    } catch (err) {
      console.error(err);
      toast.error("Registrasi gagal.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
    toast.success("Email reset dikirim!");
  };

  const refreshVerificationStatus = async () => {
  try {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();

    if (auth.currentUser.emailVerified) {
      toast.success("Email sudah diverifikasi!");
      setUser(auth.currentUser);
    } else {
      toast.error("Email belum diverifikasi!");
    }
  } catch (err) {
    console.error("refreshVerificationStatus error:", err);
    toast.error("Gagal cek status verifikasi.");
  }
};


  const resendVerification = async () => {
    if (!auth.currentUser) return toast.error("Tidak ada user.");
    await sendEmailVerification(auth.currentUser);
    toast.success("Email verifikasi dikirim ulang!");
  };

  const logout = async () => {
    try {
      if (auth.currentUser) {
        updateDoc(doc(db, "users", auth.currentUser.uid), {
          online: false,
          lastActive: serverTimestamp(),
        }).catch(() => {});

        await createLog({
          uid: auth.currentUser.uid,
          role: role ?? "unknown",
          action: "logout",
        });
      }

      await signOut(auth);
      toast("Logout berhasil!");
    } catch (err) {
      console.error(err);
      toast.error("Logout gagal.");
    }
  };

  return {
    user,
    role,
    loading,
    login,
    register,
    forgotPassword,
    resendVerification,
    refreshVerificationStatus,
    logout,
  };
}

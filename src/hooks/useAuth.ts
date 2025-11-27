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

// =========================================
// Ambil dokumen user berdasarkan UID
// =========================================
const fetchUserDoc = async (uid: string) => {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      return { id: snap.id, data: snap.data() as any };
    }

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

// =========================================
// HOOK UTAMA useAuth() — VERSI SUPER OPTIMIZED
// =========================================
export default function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const validRoles = ["admin", "owner", "manager", "staff", "customer"];

  // ====== FUNGSI INTI UNTUK LOAD USER LEBIH CEPAT ======
  const loadUser = useCallback(
    async (currentUser: User | null) => {
      if (!currentUser) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      const userDoc = await fetchUserDoc(currentUser.uid);
      if (!userDoc) {
        toast.error("Data user tidak ditemukan.");
        await signOut(auth);
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      const data = userDoc.data;
      const userRole = data.role?.toLowerCase() || "";

      // --- validasi role ---
      if (!validRoles.includes(userRole)) {
        toast.error("Role user tidak valid.");
        await signOut(auth);
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      // --- approval check ---
      if (["staff", "manager", "owner"].includes(userRole) && data.approved === false) {
        toast.error("Akun kamu belum di-approve.");
        await signOut(auth);
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      // --- khusus customer (tanpa login) ---
      if (userRole === "customer") {
        setUser(null);
        setRole("customer");
        setLoading(false);
        return;
      }

      // --- set state utama ---
      setUser(currentUser);
      setRole(userRole);

      // --- update online status ---
      updateDoc(doc(db, "users", currentUser.uid), {
        online: true,
        lastActive: serverTimestamp(),
      }).catch(() => {});

      // --- offline saat tab ditutup ---
      window.addEventListener("beforeunload", () => {
        updateDoc(doc(db, "users", currentUser.uid), {
          online: false,
          lastActive: serverTimestamp(),
        }).catch(() => {});
      });

      setLoading(false);
    },
    []
  );

  // =========================================
  // LISTENER UTAMA
  // =========================================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, loadUser);
    return () => unsub();
  }, [loadUser]);

  // =========================================
  // LOGIN (lebih cepat + log otomatis)
  // =========================================
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
      if (!userDoc) {
        toast.error("User tidak ditemukan.");
        return null;
      }

      const role = userDoc.data.role;

      if (["staff", "manager", "owner"].includes(role) && userDoc.data.approved === false) {
        toast.error("Akun belum di-approve.");
        await signOut(auth);
        return null;
      }

      toast.success("Login berhasil!");

      // LOG
      createLog({
        uid: u.uid,
        role,
        action: "login",
        target: email,
      });

      // Redirect cepat
      window.location.href =
        role === "admin"
          ? "/admin"
          : role === "owner"
          ? "/owner"
          : role === "manager"
          ? "/manag"
          : "/staff";

      return u;
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found") toast.error("Email tidak terdaftar.");
      else if (err.code === "auth/wrong-password") toast.error("Password salah.");
      else toast.error("Gagal login.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // REGISTER
  // =========================================
  const register = async (email: string, password: string, confirmPassword: string) => {
    if (password !== confirmPassword) return toast.error("Password tidak cocok!");

    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = result.user;

      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        email: newUser.email,
        role: "staff",
        approved: false,
        online: false,
        createdAt: serverTimestamp(),
      });

      await sendEmailVerification(newUser);
      toast.success("Akun dibuat! Cek email untuk verifikasi.");

      return newUser;
    } catch (err) {
      console.error(err);
      toast.error("Gagal mendaftar.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  const forgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Email reset dikirim!");
    } catch {
      toast.error("Gagal mengirim reset password.");
    }
  };

  const resendVerification = async () => {
    if (!auth.currentUser) return toast.error("Tidak ada user.");
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success("Verifikasi dikirim ulang!");
    } catch {
      toast.error("Gagal mengirim ulang.");
    }
  };

  const refreshVerificationStatus = async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    auth.currentUser.emailVerified
      ? toast.success("Email sudah diverifikasi!")
      : toast("Belum diverifikasi.");
  };

  // =========================================
  // LOGOUT + LOG
  // =========================================
   // LOGOUT + LOG
  const logout = async () => {
    try {
      if (auth.currentUser) {
        // set offline timestamp (don't await if you don't want to block)
        updateDoc(doc(db, "users", auth.currentUser.uid), {
          online: false,
          lastActive: serverTimestamp(),
        }).catch(() => {});

        // safe role fallback so TypeScript is happy
        await createLog({
          uid: auth.currentUser.uid,
          role: role ?? "unknown",
          action: "logout",
        });
      }

      await signOut(auth);
      toast("Kamu sudah logout.");
    } catch (err) {
      console.error("logout error:", err);
      toast.error("Gagal logout.");
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

"use client";

import { useState, useEffect } from "react";
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
  collection,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import toast from "react-hot-toast";

export default function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // -------------------------
  // Helper: ambil user doc (coba direct id dulu, kalau tidak ada pakai query uid)
  // -------------------------
  const fetchUserDocByAuthUid = async (authUid: string) => {
    try {
      // Try document with id = authUid (recommended structure)
      const ref = doc(db, "users", authUid);
      const snap = await getDoc(ref);
      if (snap.exists()) return { id: snap.id, data: snap.data() as any };

      // Fallback: cari dokumen yang punya field uid == authUid (for legacy data like UID1)
      const q = query(collection(db, "users"), where("uid", "==", authUid));
      const snaps = await getDocs(q);
      if (!snaps.empty) {
        const d = snaps.docs[0];
        return { id: d.id, data: d.data() as any };
      }

      return null;
    } catch (err) {
      console.error("fetchUserDocByAuthUid error:", err);
      return null;
    }
  };

  // -------------------------
  // Pantau status login user
  // -------------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRes = await fetchUserDocByAuthUid(currentUser.uid);
          if (docRes && docRes.data) {
            const userRole = (docRes.data.role || "").toLowerCase(); // ✅ lowercase fix
            setRole(userRole);
            console.log("🔥 Detected role:", userRole);
          } else {
            setRole(null);
          }
        } catch (err) {
          console.error("onAuthStateChanged fetch role error:", err);
          setRole(null);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);


  // -------------------------
  // LOGIN
  // -------------------------
  const login = async (email: string, password: string): Promise<User | null> => {
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      const u = res.user;
      if (!u.emailVerified) {
        toast.error("⚠️ Email belum diverifikasi. Silakan cek inbox.");
        await signOut(auth); // sign out to prevent partially signed sessions
        return null;
      }
      toast.success(" Login berhasil!");
      return u;
    } catch (err: any) {
      console.error("login error:", err);
      if (err.code === "auth/user-not-found") toast.error("Email tidak terdaftar!");
      else if (err.code === "auth/wrong-password") toast.error("Email atau password salah!");
      else if (err.code === "auth/too-many-requests")
        toast.error("Terlalu banyak percobaan login. Coba lagi nanti.");
      else toast.error("Gagal login. Coba lagi.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // REGISTER (simpan doc id = auth.uid, approved:false)
  // -------------------------
  const register = async (
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<User | null> => {
    if (password !== confirmPassword) {
      toast.error("❌ Password tidak cocok!");
      return null;
    }
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter!");
      return null;
    }

    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = res.user;

      // Simpan doc dengan document id = newUser.uid (lebih konsisten)
      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        email: newUser.email,
        role: "staff",
        approved: false, // default menunggu approval owner
        createdAt: serverTimestamp(),
      });

      // Kirim email verifikasi
      await sendEmailVerification(newUser);

      toast.success("✅ Akun dibuat! Cek email untuk verifikasi dan tunggu approval owner.");
      return newUser;
    } catch (err: any) {
      console.error("register error:", err);
      if (err.code === "auth/email-already-in-use") toast.error("Email sudah terdaftar!");
      else if (err.code === "auth/invalid-email") toast.error("Format email tidak valid!");
      else toast.error("Gagal mendaftar. Coba lagi.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // RESET PASSWORD
  // -------------------------
  const forgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("📩 Email reset password telah dikirim!");
    } catch (err: any) {
      console.error("forgotPassword error:", err);
      toast.error("Gagal mengirim email reset password.");
    }
  };

  // -------------------------
  // RESEND VERIFICATION
  // -------------------------
  const resendVerification = async () => {
    if (!auth.currentUser) {
      toast.error("Kamu belum login.");
      return;
    }
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success("📨 Email verifikasi telah dikirim ulang!");
    } catch (err: any) {
      console.error("resendVerification error:", err);
      if (err.code === "auth/too-many-requests")
        toast.error("Terlalu sering kirim ulang. Tunggu beberapa menit.");
      else toast.error("Gagal mengirim ulang verifikasi.");
    }
  };

  // -------------------------
  // REFRESH VERIFICATION STATUS
  // -------------------------
  const refreshVerificationStatus = async () => {
    if (!auth.currentUser) return;
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) toast.success("✅ Email sudah diverifikasi!");
      else toast("⚠️ Email belum diverifikasi.");
    } catch (err) {
      console.error("refreshVerificationStatus error:", err);
      toast.error("Gagal memeriksa status verifikasi.");
    }
  };

  // -------------------------
  // LOGOUT
  // -------------------------
  const logout = async () => {
    try {
      await signOut(auth);
      toast("👋 Kamu sudah logout.");
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

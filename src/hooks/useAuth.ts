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

interface CustomUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  role: UserRole;
  cabang?: string; // Make optional as it might not be present for all roles
  approved: boolean;
  online: boolean;
  photoURL?: string;
  displayName?: string;
  firebaseUser: User;
}

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
  const [user, setUser] = useState<CustomUser | null>(null);
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

    const customUser: CustomUser = {
      uid: currentUser.uid,
      email: currentUser.email,
      emailVerified: currentUser.emailVerified,
      role: userRole,
      cabang: data.cabang, // Assuming 'cabang' exists in userDoc.data
      approved: data.approved,
      online: data.online,
      photoURL: data.photoURL,
      displayName: data.displayName,
      firebaseUser: currentUser,
    };
    setUser(customUser);
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

      const customUser: CustomUser = {
        uid: u.uid,
        email: u.email,
        emailVerified: u.emailVerified,
        role: userRole,
        cabang: userDoc.data.cabang, // Assuming 'cabang' exists in userDoc.data
        approved: userDoc.data.approved,
        online: userDoc.data.online,
        photoURL: userDoc.data.photoURL,
        displayName: userDoc.data.displayName,
        firebaseUser: u,
      };
      setUser(customUser); // Set the internal state

      
      createLog({
        uid: u.uid,
        role: userRole,
        action: "login",
        target: email,
      });

      return customUser;
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
    if (password !== confirmPassword) {
      toast.error("Password tidak cocok!");
      throw new Error("Password tidak cocok!");
    }

    setLoading(true);

    try {
      // Fetch password policy from public API endpoint
      const response = await fetch("/api/settings/security");
      if (response.ok) {
        const policy = await response.json();

        // Only validate if the policy object is not empty
        if (Object.keys(policy).length > 0) {
          const validationErrors: string[] = [];

          const passLength = policy.passwordLength ?? 8;
          if (password.length < passLength) {
            validationErrors.push(`- Minimal ${passLength} karakter`);
          }
          if (policy.requireUppercase && !/[A-Z]/.test(password)) {
            validationErrors.push("- Harus mengandung huruf kapital (A-Z)");
          }
          if (policy.requireNumbers && !/\d/.test(password)) {
            validationErrors.push("- Harus mengandung angka (0-9)");
          }
          if (policy.requireSymbols && !/[!@#$%^&*]/.test(password)) {
            validationErrors.push("- Harus mengandung simbol (e.g., !@#$%)");
          }

          if (validationErrors.length > 0) {
            const errorMessage = "Password Anda tidak memenuhi syarat:\n" + validationErrors.join("\n");
            throw new Error(errorMessage);
          }
        }
      }
      // If the fetch fails or returns no policy, registration proceeds without custom validation.

      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const newUser = result.user;

      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        email: newUser.email,
        role: ROLES.PENDING,
        approved: false,
        online: false,
        createdAt: serverTimestamp(),
      });

      await sendEmailVerification(newUser);

      // Return the new user object on success
      return newUser;
    } catch (err: any) {
      // Log the full error for debugging but re-throw it for the UI.
      console.error("Registration process failed:", err);
      throw err;
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
      const userDoc = await fetchUserDoc(auth.currentUser.uid);
      if (userDoc) {
        const data = userDoc.data;
        const userRole = (data.role as string).toLowerCase() as UserRole;
        const customUser: CustomUser = {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          emailVerified: auth.currentUser.emailVerified,
          role: userRole,
          cabang: data.cabang,
          approved: data.approved,
          online: data.online,
          photoURL: data.photoURL,
          displayName: data.displayName,
          firebaseUser: auth.currentUser,
        };
        toast.success("Email sudah diverifikasi!");
        setUser(customUser);
      } else {
        toast.error("Gagal memuat data pengguna setelah verifikasi.");
      }
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
    setLoading(true);
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
      setLoading(false);
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

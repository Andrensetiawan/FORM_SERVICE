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
  GoogleAuthProvider,
  signInWithPopup,
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
  photoURL?: string | null;
  displayName?: string | null;
  firebaseUser: User;
}

const fetchUserDoc = async (uid: string) => {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (snap.exists()) return { id: snap.id, data: snap.data() as any };
    return null;
  } catch (err) {
    console.error("fetchUserDoc error:", err);
    return null;
  }
};

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

    // If email is not verified, do not establish a session.
    // This allows the login page to handle the "resend verification" flow
    // without this hook signing the user out.
    if (!currentUser.emailVerified) {
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }

    const userDoc = await fetchUserDoc(currentUser.uid);
    if (!userDoc) {
      // This can happen if auth exists but firestore doc doesn't.
      // It's safer to sign out.
      toast.error("Data pengguna tidak ditemukan.");
      await signOut(auth);
      setLoading(false);
      return;
    }

    const data = userDoc.data;
    const userRole = (data.role as string).toLowerCase() as UserRole;

    if (!Object.values(ROLES).includes(userRole)) {
      toast.error("Role pengguna tidak valid.");
      await signOut(auth);
      setLoading(false);
      return;
    }

    // This check now correctly runs only on VERIFIED users.
    if (isRoleRequiringApproval(userRole) && data.approved === false) {
      toast.error("Akun Anda belum disetujui oleh admin.");
      await signOut(auth);
      setLoading(false);
      return;
    }

    const customUser: CustomUser = {
      uid: currentUser.uid,
      email: currentUser.email,
      emailVerified: currentUser.emailVerified,
      role: userRole,
      cabang: data.cabang,
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

  const login = async (email: string, password: string) => {
    setLoading(true);

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const u = result.user;

      // This is the key part for the UI. We return a user object regardless,
      // but the `emailVerified` flag will determine the UI flow.
      // The `loadUser` hook will prevent a full session from starting.
      const userDoc = await fetchUserDoc(u.uid);

      // This case is rare but possible if Firestore doc creation failed during registration
      if (!userDoc) {
        throw new Error("auth/user-not-found-in-firestore");
      }
      
      const userRole = userDoc.data.role as UserRole;

       const customUser: CustomUser = {
        uid: u.uid,
        email: u.email,
        emailVerified: u.emailVerified,
        role: userRole,
        cabang: userDoc.data.cabang,
        approved: userDoc.data.approved,
        online: userDoc.data.online,
        photoURL: u.photoURL,
        displayName: u.displayName,
        firebaseUser: u,
      };

      if (!u.emailVerified) {
        // Return the user object, but don't set the session.
        // The UI will use this to show the "resend" button.
        return customUser;
      }

      // For verified users, `onAuthStateChanged` will eventually call `loadUser`
      // which will set the session state. We return the user here for immediate feedback.
      setUser(customUser);
      createLog({
        uid: u.uid,
        role: userRole,
        action: "login",
        target: email,
      });

      return customUser;

    } catch (err: any) {
      console.error("Login error in useAuth:", err);
      // Re-throw the original Firebase error so the UI can handle it
      throw err;
    } finally {
      setLoading(false);
    }
  };

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
      const response = await fetch("/api/settings/security");
      if (response.ok) {
        const policy = await response.json();
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
      const result = await createUserWithEmailAndPassword(auth, email, password);
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
      return newUser;
    } catch (err: any) {
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
        // Manually trigger loadUser to establish session
        await loadUser(auth.currentUser);
      }
    } catch (err) {
      console.error("refreshVerificationStatus error:", err);
      toast.error("Gagal cek status verifikasi.");
    }
  };

  const resendVerification = async () => {
    if (!auth.currentUser) throw new Error("User not logged in for verification resend.");
    await sendEmailVerification(auth.currentUser);
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
    } finally {
        setLoading(false);
        setUser(null);
        setRole(null);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      let userDoc = await fetchUserDoc(user.uid);
      if (!userDoc) {
        const newUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: ROLES.PENDING,
          approved: false,
          online: true,
          lastActive: serverTimestamp(),
          createdAt: serverTimestamp(),
        };
        await setDoc(doc(db, "users", user.uid), newUser);
        userDoc = { id: user.uid, data: newUser };
      } else {
        await updateDoc(doc(db, "users", user.uid), {
          online: true,
          lastActive: serverTimestamp(),
        });
      }
      // `onAuthStateChanged` will handle the rest via `loadUser`
    } catch (error) {
      console.error("Google Sign-In error:", error);
      toast.error("Gagal login dengan Google.");
    } finally {
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
    signInWithGoogle,
  };
}

"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { getUserRole } from "@/lib/auth"; // ambil role user dari Firestore

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[]; // misal: ["staff", "manager", "owner"]
}

export default function ProtectedRoute({
  children,
  allowedRoles = ["staff", "manager", "owner"],
}: ProtectedRouteProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login"); // belum login → ke halaman login
        setLoading(false);
        return;
      }

      if (!currentUser.emailVerified) {
        router.push("/verify-email"); // bisa kamu ganti ke halaman verifikasi email
        setLoading(false);
        return;
      }

      // Ambil role dari Firestore
      const userRole = await getUserRole(currentUser.uid);
      if (!userRole) {
        router.push("/unauthorized"); // jika role belum diset di Firestore
        setLoading(false);
        return;
      }

      setUser(currentUser);
      setRole(userRole);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <p className="text-center mt-10">🔄 Memuat...</p>;
  }

  // Jika user tidak sesuai role
  if (role && !allowedRoles.includes(role)) {
    router.push("/unauthorized");
    return null;
  }

  return <>{user && children}</>;
}

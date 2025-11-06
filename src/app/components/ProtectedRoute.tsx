"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth"; // ✅ pakai hook-mu sendiri

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  allowedRoles = ["staff", "management", "owner"],
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, role, loading } = useAuth(); // ✅ ambil dari hook
  console.log("🧩 ProtectedRoute Role:", role);

  if (loading) {
    return <p className="text-center mt-10">🔄 Memuat...</p>;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  if (!role) {
    router.push("/unauthorized");
    return null;
  }

  if (!allowedRoles.includes(role)) {
    console.warn(`🚫 Role "${role}" tidak diizinkan`);
    router.push("/unauthorized");
    return null;
  }

  console.log("✅ Akses diizinkan:", role);
  return <>{children}</>;
}

"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { ROLES } from "@/lib/roles";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  allowedRoles = [ROLES.STAFF, ROLES.MANAGER, ROLES.OWNER, ROLES.ADMIN],
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

  // Admin is a superuser: allow access to everything
  if (role === ROLES.ADMIN) {
    console.log("🔑 Admin override - full access");
    return <>{children}</>;
  }

  if (!allowedRoles.includes(role)) {
    console.warn(`🚫 Role "${role}" tidak diizinkan`);
    router.push("/unauthorized");
    return null;
  }

  console.log("✅ Akses diizinkan:", role);
  return <>{children}</>;
}

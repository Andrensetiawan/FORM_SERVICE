"use client";

import { ReactNode, useEffect } from "react";
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
  const { user, role, loading } = useAuth();

  // ⏳ 1. TUNGGU SAMPAI AUTH LOADING SELESAI
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        🔄 Memuat...
      </div>
    );
  }

  // ❌ 2. JIKA BELUM LOGIN → ARAHKAN LOGIN
  if (!user) {
    router.replace("/");
    return null;
  }

  // ⏳ 3. JIKA ROLE MASIH NULL → TUNGGU !!
  //    (INI FIX PALING PENTING)
  if (!role) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        🔄 Memuat hak akses...
      </div>
    );
  }

  // 🔑 4. ADMIN = SUPERUSER (BOLEH AKSES SEMUA)
  if (role === ROLES.ADMIN) {
    return <>{children}</>;
  }

  // 🚫 5. ROLE TIDAK DIIZINKAN
  if (!allowedRoles.includes(role)) {
    router.replace("/unauthorized");
    return null;
  }

  // ✔ 6. ROLE VALID → IZINKAN
  return <>{children}</>;
}

"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { ROLES } from "@/lib/roles";

export default function UnauthorizedPage() {
  const { role } = useAuth();

  const getDashboardUrl = () => {
    switch (role) {
      case ROLES.ADMIN:
        return "/admin";
      case ROLES.OWNER:
        return "/owner";
      case ROLES.MANAGER:
        return "/manager";
      case ROLES.STAFF:
        return "/staff";
      default:
        return "/";
    }
  };

  return (
    <div className="h-screen w-full flex flex-col justify-center items-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800 border border-gray-700 shadow-2xl p-10 rounded-2xl max-w-md text-center"
      >
        <div className="flex justify-center mb-4">
          <ShieldAlert className="w-14 h-14 text-red-400 drop-shadow-lg" />
        </div>

        <h1 className="text-4xl font-bold">Akses Ditolak</h1>
        <p className="text-gray-200 mt-3">
          Kamu tidak memiliki izin untuk membuka halaman ini.
          Silakan kembali ke dashboard atau login ulang.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={getDashboardUrl()}
            className="w-full text-center py-2 rounded-lg font-semibold bg-red-500/90 hover:bg-red-600 transition"
          >
            Kembali ke Dashboard
          </Link>

          <Link
            href="/login"
            className="w-full text-center py-2 rounded-lg font-semibold border border-gray-600 hover:bg-gray-700 transition"
          >
            Login Ulang
          </Link>
        </div>
      </motion.div>

      <p className="text-gray-600 text-xs mt-6">
        Error Code: <span className="text-red-500">401 Unauthorized</span>
      </p>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Users, ClipboardList, FileText } from "lucide-react";

export default function ManagementDashboard() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login"); // belum login
      } else if (role !== "owner" && role !== "manager") {
        router.push("/unauthorized"); // bukan owner/manager
      }
    }
  }, [user, role, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Loading...
      </div>
    );
  }

  // Kalau lolos, tampilkan dashboard seperti sebelumnya
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Dashboard {role === "owner" ? "Owner" : "Manager"}
          </h1>
          <p className="text-gray-600">
            Selamat datang kembali! Kelola sistem dan pantau aktivitas staff di sini.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ scale: 1.04, y: -5 }}
            className="bg-yellow-50 rounded-2xl shadow-md p-6 cursor-pointer border border-gray-200"
            onClick={() => router.push("/management/pending-users")}
          >
            <div className="flex items-center gap-4 mb-3">
              <ClipboardList className="w-10 h-10 text-yellow-600" />
              <h3 className="text-xl font-semibold text-yellow-700">Pending Approval</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Lihat staff yang menunggu persetujuan akun.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.04, y: -5 }}
            className="bg-blue-50 rounded-2xl shadow-md p-6 cursor-pointer border border-gray-200"
            onClick={() => router.push("/management/staff")}
          >
            <div className="flex items-center gap-4 mb-3">
              <Users className="w-10 h-10 text-blue-600" />
              <h3 className="text-xl font-semibold text-blue-700">Daftar Staff</h3>
            </div>
            <p className="text-gray-600 text-sm">Kelola akun staff yang sudah aktif.</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.04, y: -5 }}
            className="bg-green-50 rounded-2xl shadow-md p-6 cursor-pointer border border-gray-200"
            onClick={() => router.push("/management/reports")}
          >
            <div className="flex items-center gap-4 mb-3">
              <FileText className="w-10 h-10 text-green-600" />
              <h3 className="text-xl font-semibold text-green-700">Laporan</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Pantau laporan aktivitas dan performa sistem.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

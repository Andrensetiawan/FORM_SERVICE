"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Hourglass } from "lucide-react";
import useAuth from "@/hooks/useAuth";

export default function PendingApprovalPage() {
  const { logout } = useAuth();

  return (
    <div className="h-screen w-full flex flex-col justify-center items-center bg-gray-100 text-gray-800 p-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-md rounded-xl border border-gray-200 p-10 max-w-md text-center"
      >
        <div className="flex justify-center mb-4">
          <Hourglass className="w-14 h-14 text-blue-500 drop-shadow-lg" />
        </div>

        <h1 className="text-3xl font-bold text-blue-600">Akun Menunggu Persetujuan</h1>
        <p className="text-gray-600 mt-3">
          Terima kasih telah mendaftar. Akun Anda saat ini sedang ditinjau oleh administrator.
          Anda akan dapat login setelah akun Anda disetujui.
        </p>
        <p className="text-gray-600 mt-2">
            Silakan hubungi manajer atau admin jika Anda memiliki pertanyaan.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => logout().then(() => window.location.href = '/login')}
            className="w-full text-center py-2 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition"
          >
            Logout dan Kembali ke Login
          </button>
        </div>
      </motion.div>

      <p className="text-gray-500 text-xs mt-6">
        <span className="text-black">PT.Alif Cyber Solution</span>
      </p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Calendar, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";

export default function ReportsPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState("2025-10");

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (role !== "owner" && role !== "manager") router.push("/unauthorized");
    }
  }, [user, role, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Loading laporan...
      </div>
    );
  }

  const reports = [
    {
      id: 1,
      title: "Aktivitas Staff Bulanan",
      icon: <UserCheck className="w-8 h-8 text-blue-600" />,
      desc: "Rekap aktivitas dan performa setiap staff bulan ini.",
      date: "Oktober 2025",
    },
    {
      id: 2,
      title: "Laporan Formulir Masuk",
      icon: <FileText className="w-8 h-8 text-green-600" />,
      desc: "Statistik jumlah formulir yang diterima dan disetujui.",
      date: "Oktober 2025",
    },
    {
      id: 3,
      title: "Analisis Penggunaan Sistem",
      icon: <Calendar className="w-8 h-8 text-purple-600" />,
      desc: "Frekuensi login dan penggunaan fitur utama aplikasi.",
      date: "Oktober 2025",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 py-12 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Laporan Management</h1>
          <p className="text-gray-600">
            Lihat rekap aktivitas, performa, dan data sistem berdasarkan bulan.
          </p>
          <div className="mt-6 flex justify-center">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {reports.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.03, y: -3 }}
              className="bg-white rounded-2xl shadow-md border border-gray-200 p-6"
            >
              <div className="flex items-center gap-4 mb-3">
                {item.icon}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.date}</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4">{item.desc}</p>
              <button
                onClick={() => router.push(`/management/reports/${item.id}`)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Lihat Detail
              </button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

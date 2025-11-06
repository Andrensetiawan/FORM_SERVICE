"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

interface ReportData {
  title: string;
  desc: string;
  month: string;
  stats?: {
    formMasuk: number;
    disetujui: number;
    pending: number;
  };
  updatedAt?: string;
}

export default function ReportDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Ambil data dari Firestore berdasarkan ID
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const docRef = doc(db, "reports", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setReport(docSnap.data() as ReportData);
        } else {
          router.push("/management/laporan");
        }
      } catch (error) {
        console.error("Gagal ambil laporan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Memuat laporan...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-400">
        Laporan tidak ditemukan.
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8 md:p-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Tombol Kembali */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-8 font-medium transition"
        >
          <ArrowLeft size={18} /> Kembali ke Daftar Laporan
        </button>

        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{report.title}</h1>
        <p className="text-gray-600 mb-4">{report.desc}</p>
        <p className="text-sm text-gray-500 mb-8">
          Bulan: <span className="font-medium">{report.month}</span>
        </p>

        {/* Konten Statistik */}
        {report.stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl text-center">
              <p className="text-sm text-gray-500">Form Masuk</p>
              <p className="text-2xl font-bold text-blue-700">
                {report.stats.formMasuk}
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 p-5 rounded-xl text-center">
              <p className="text-sm text-gray-500">Disetujui</p>
              <p className="text-2xl font-bold text-green-700">
                {report.stats.disetujui}
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 p-5 rounded-xl text-center">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-700">
                {report.stats.pending}
              </p>
            </div>
          </div>
        )}

        {/* Info Terakhir Diperbarui */}
        <div className="border-t pt-6 text-gray-500 text-sm">
          <p>
            Terakhir diperbarui:{" "}
            <span className="font-medium">
              {new Date(report.updatedAt || "").toLocaleString("id-ID")}
            </span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

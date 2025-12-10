"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CheckCircle, Clock, Wrench } from "lucide-react";
import NavbarSwitcher from "@/components/navbars/NavbarSwitcher";

type ServiceDoc = {
  id?: string;
  status?: string;
  assignedTo?: string;
  createdAt?: any;
  closedAt?: any;
};

type UserDoc = {
  uid: string;
  name: string;
  division?: string;
};

export default function TechnicianDetailPage() {
  const router = useRouter();
  const { id } = useParams(); // UID teknisi
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceDoc[]>([]);
  const [techInfo, setTechInfo] = useState<UserDoc | null>(null);

  // ======================
  // 🔹 Fetch Data Firestore
  // ======================
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Ambil semua servis milik teknisi ini
        const q = query(collection(db, "service_requests"), where("assignedTo", "==", id));
        const snap = await getDocs(q);
        const docs: ServiceDoc[] = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ServiceDoc[];
        setServices(docs);

        // Ambil data teknisi
        const usersSnap = await getDocs(collection(db, "users"));
        const user = usersSnap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .find((u) => u.uid === id);
        setTechInfo(user || null);
      } catch (err) {
        console.error("Error load data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // ======================
  // 🔸 Hitung Statistik
  // ======================
  const summary = useMemo(() => {
    let done = 0;
    let pending = 0;
    let totalDur = 0;
    let durCount = 0;

    services.forEach((s) => {
      const status = (s.status || "").toLowerCase();
      const created =
        s.createdAt instanceof Timestamp
          ? s.createdAt.toDate()
          : s.createdAt
          ? new Date(s.createdAt)
          : null;
      const closed =
        s.closedAt instanceof Timestamp
          ? s.closedAt.toDate()
          : s.closedAt
          ? new Date(s.closedAt)
          : null;

      if (status.includes("done") || status.includes("selesai")) {
        done++;
        if (created && closed) {
          totalDur += closed.getTime() - created.getTime();
          durCount++;
        }
      } else pending++;
    });

    const avgMs = durCount > 0 ? totalDur / durCount : 0;
    const avgH = Math.floor(avgMs / (1000 * 60 * 60));
    const avgM = Math.round((avgMs % (1000 * 60 * 60)) / (1000 * 60));

    return { done, pending, avgH, avgM };
  }, [services]);

  // ======================
  // 🔸 Aktivitas 7 Hari Terakhir
  // ======================
  const activityData = useMemo(() => {
    const now = new Date();
    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const result = days.map((day) => ({ day, count: 0 }));

    services.forEach((s) => {
      const created =
        s.createdAt instanceof Timestamp
          ? s.createdAt.toDate()
          : s.createdAt
          ? new Date(s.createdAt)
          : null;
      if (!created) return;

      const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 7) {
        const dayIdx = created.getDay();
        result[dayIdx].count++;
      }
    });
    return result;
  }, [services]);

  // ======================
  // 🔹 UI Rendering
  // ======================
  if (loading) return <div className="flex justify-center py-20">Memuat data...</div>;

  return (
    <>
      <NavbarSwitcher />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="min-h-screen p-6 md:p-10 bg-gradient-to-b from-gray-50 to-white"
      >
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <button
            onClick={() => router.push("/management/laporan")}
            className="text-blue-600 hover:underline text-sm mb-4"
          >
            ← Kembali ke Laporan
          </button>

          {/* Header */}
          <div className="bg-white rounded-2xl shadow p-6 mb-6 border border-gray-100">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              {techInfo?.name || "Nama Tidak Dikenal"}
            </h1>
            <p className="text-gray-500 text-sm">
              Divisi: <span className="font-medium">{techInfo?.division || "-"}</span>
            </p>
          </div>

          {/* Statistik */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <motion.div
              whileHover={{ y: -3 }}
              className="p-5 bg-green-50 border rounded-xl shadow-sm"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-600" />
                <div>
                  <p className="text-xs text-gray-500">Servis Selesai</p>
                  <p className="text-2xl font-bold text-gray-800">{summary.done}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -3 }}
              className="p-5 bg-yellow-50 border rounded-xl shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Clock className="text-yellow-600" />
                <div>
                  <p className="text-xs text-gray-500">Servis Pending</p>
                  <p className="text-2xl font-bold text-gray-800">{summary.pending}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -3 }}
              className="p-5 bg-blue-50 border rounded-xl shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Wrench className="text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">Rata-rata Waktu</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {summary.avgH}j {summary.avgM}m
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Grafik Aktivitas */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow p-5">
            <h3 className="font-semibold text-gray-800 mb-3">
              Aktivitas 7 Hari Terakhir
            </h3>
            <div className="w-full min-h-[320px]">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={activityData}>
                  <XAxis dataKey="day" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                    {activityData.map((_, i) => (
                      <Cell key={i} fill="#3b82f6" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

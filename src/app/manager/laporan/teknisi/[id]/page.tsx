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
  assignedTechnician?: string;
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
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30); // Default to last 30 days
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // ======================
  // 🔹 Fetch Data Firestore
  // ======================
  useEffect(() => {
    const fetchData = async () => {
      console.log("Fetching data for technician UID:", id);
      try {
        // 1. Ambil data teknisi berdasarkan UID (id dari useParams)
        const usersSnap = await getDocs(collection(db, "users"));
        const techUser = usersSnap.docs
          .map((d) => ({ uid: d.id, ...(d.data() as any) })) // Ensure uid is doc.id
          .find((u) => u.uid === id);
        
        console.log("Fetched techUser:", techUser);
        if (!techUser) {
          console.warn("Teknisi tidak ditemukan dengan UID:", id);
          setLoading(false);
          return;
        }
        setTechInfo(techUser);

        console.log("Technician name:", techUser.name, "Email:", techUser.email);
        const technicianEmail = techUser.email; // Assuming 'email' field exists in user doc
        if (!technicianEmail) {
          console.warn("Email teknisi tidak ditemukan untuk UID:", id);
          setLoading(false);
          return;
        }

        // 2. Ambil semua servis milik teknisi ini berdasarkan EMAIL
        const startTimestamp = Timestamp.fromDate(new Date(startDate));
        const endTimestamp = Timestamp.fromDate(new Date(new Date(endDate).setHours(23, 59, 59, 999)));

        console.log("Querying service_requests with assignedTechnician:", technicianEmail, "startDate:", startTimestamp.toDate(), "endDate:", endTimestamp.toDate());
        const q = query(
          collection(db, "service_requests"),
          where("created_by", "==", id), // Use technician's UID
          where("createdAt", ">=", startTimestamp),
          where("createdAt", "<=", endTimestamp)
        );
        const snap = await getDocs(q);
        console.log("Service requests snapshot size:", snap.docs.length);
        const docs: ServiceDoc[] = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ServiceDoc[];
        setServices(docs);
        console.log("Mapped services:", docs);

      } catch (err) {
        console.error("Error load data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, startDate, endDate]);

  // ======================
  // 🔸 Hitung Statistik
  // ======================
  const summary = useMemo(() => {
    let done = 0;
    let pending = 0;
    let totalDur = 0;
    let durCount = 0;
    let lastActivityTimestamp: number | null = null;

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

      if (created) {
        if (!lastActivityTimestamp || created.getTime() > lastActivityTimestamp) {
          lastActivityTimestamp = created.getTime();
        }
      }
      if (closed) {
        if (!lastActivityTimestamp || closed.getTime() > lastActivityTimestamp) {
          lastActivityTimestamp = closed.getTime();
        }
      }

      if (status.includes("done") || status.includes("selesai")) {
        done++;
        if (created && closed) {
          totalDur += closed.getTime() - created.getTime();
          durCount++;
        }
      } else pending++;
    });

    const totalServices = done + pending;
    const avgMs = durCount > 0 ? totalDur / durCount : 0;
    const avgH = Math.floor(avgMs / (1000 * 60 * 60));
    const avgM = Math.round((avgMs % (1000 * 60 * 60)) / (1000 * 60));
    const successRate = totalServices > 0 ? (done / totalServices) * 100 : 0;
    const lastActivityDate = lastActivityTimestamp ? new Date(lastActivityTimestamp).toLocaleDateString("id-ID") : "-";

    return { done, pending, totalServices, avgH, avgM, successRate, lastActivityDate };
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
            onClick={() => router.push("/manager/laporan")}
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
            </p>
            <div className="flex flex-col md:flex-row gap-4 mt-4">
              <div className="flex-1">
                <label htmlFor="startDate" className="block text-xs font-medium text-gray-500 mb-1">Dari Tanggal:</label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="endDate" className="block text-xs font-medium text-gray-500 mb-1">Sampai Tanggal:</label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Statistik */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <motion.div
              whileHover={{ y: -3 }}
              className="p-5 bg-blue-50 border rounded-xl shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Wrench className="text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">Total Servis</p>
                  <p className="text-2xl font-bold text-gray-800">{summary.totalServices}</p>
                </div>
              </div>
            </motion.div>
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
              className="p-5 bg-purple-50 border rounded-xl shadow-sm"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="text-purple-600" />
                <div>
                  <p className="text-xs text-gray-500">% Sukses</p>
                  <p className="text-2xl font-bold text-gray-800">{summary.successRate.toFixed(0)}%</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -3 }}
              className="p-5 bg-red-50 border rounded-xl shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Clock className="text-red-600" />
                <div>
                  <p className="text-xs text-gray-500">Aktivitas Terakhir</p>
                  <p className="text-2xl font-bold text-gray-800">{summary.lastActivityDate}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -3 }}
              className="p-5 bg-orange-50 border rounded-xl shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Wrench className="text-orange-600" />
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
          <div className="bg-white rounded-2xl border border-gray-100 shadow p-5 mb-8">
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

          {/* Daftar Servis */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Daftar Servis</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Track Number</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dibuat Pada</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ditutup Pada</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {services.map((service) => (
                    <tr key={service.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{service.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {service.createdAt instanceof Timestamp ? service.createdAt.toDate().toLocaleString() : (service.createdAt ? new Date(service.createdAt).toLocaleString() : '-')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {service.closedAt instanceof Timestamp ? service.closedAt.toDate().toLocaleString() : (service.closedAt ? new Date(service.closedAt).toLocaleString() : '-')}
                      </td>
                    </tr>
                  ))}
                  {services.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">Tidak ada servis dalam rentang tanggal ini.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

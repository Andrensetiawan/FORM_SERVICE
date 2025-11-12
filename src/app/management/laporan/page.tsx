"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList,
} from "recharts";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs, query, Timestamp } from "firebase/firestore";
import { Wrench, CheckCircle, Clock, User } from "lucide-react";
import NavbarManagement from "@/app/components/navbars/NavbarManagement";
import { useRouter } from "next/navigation";

// =======================
// 🔹 Type Declaration
// =======================
type ServiceDoc = {
  id?: string;
  status?: string;
  assignedTo?: string;
  assignedName?: string;
  createdAt?: any;
  closedAt?: any;
};

type StaffInfo = {
  id: string;
  uid: string;
  name: string;
  division?: string;
};

// =======================
// 🔹 Utility Function
// =======================
const formatDate = (date: Date) => {
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// =======================
// 🔹 Main Component
// =======================
export default function ServiceReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceDoc[]>([]);
  const [staffList, setStaffList] = useState<StaffInfo[]>([]);
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("all");
  const [divisionFilter, setDivisionFilter] = useState<string>("all");

  // =======================
  // 🔸 Ambil Data Firestore
  // =======================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "service_requests"));
        const snaps = await getDocs(q);
        const serviceDocs: ServiceDoc[] = snaps.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as ServiceDoc[];

        // Ambil semua user dengan UID
        const userSnaps = await getDocs(collection(db, "users"));
        const userDocs: StaffInfo[] = userSnaps.docs.map((u) => ({
          id: u.id,
          uid: (u.data().uid as string) || u.id,
          name: (u.data().name as string) || "Unknown",
          division: (u.data().division as string) || "-",
        }));

        setServices(serviceDocs);
        setStaffList(userDocs);
      } catch (error) {
        console.error("Firestore fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // =======================
  // 🔸 Filter Periode
  // =======================
  const filtered = useMemo(() => {
    if (period === "all") return services;
    const now = new Date();
    return services.filter((s) => {
      const created =
        s.createdAt instanceof Timestamp
          ? s.createdAt.toDate()
          : s.createdAt
          ? new Date(s.createdAt)
          : null;
      if (!created) return false;
      const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      if (period === "today") return created.toDateString() === now.toDateString();
      if (period === "week") return diffDays <= 7;
      if (period === "month") return diffDays <= 30;
      return true;
    });
  }, [services, period]);

  // =======================
  // 🔸 Hitung Statistik
  // =======================
  const summary = useMemo(() => {
    const total = filtered.length;
    let done = 0;
    let pending = 0;
    const byStaff: Record<
      string,
      {
        name: string;
        division?: string;
        count: number;
        done: number;
        pending: number;
        durasi: number;
        selesai: number;
        lastServiceDate?: Date | null;
      }
    > = {};

    filtered.forEach((s) => {
      const status = (s.status || "").toLowerCase();
      const staffId = s.assignedTo || "unknown";
      const staffInfo = staffList.find(
        (x) => x.uid === staffId || x.id === staffId
      );

      if (!byStaff[staffId])
        byStaff[staffId] = {
          name: staffInfo?.name || s.assignedName || "Unknown",
          division: staffInfo?.division || "-",
          count: 0,
          done: 0,
          pending: 0,
          durasi: 0,
          selesai: 0,
          lastServiceDate: null,
        };

      byStaff[staffId].count++;

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
        byStaff[staffId].done++;
        if (created && closed && closed >= created) {
          const durasi = closed.getTime() - created.getTime();
          byStaff[staffId].durasi += durasi;
          byStaff[staffId].selesai++;
        }
        byStaff[staffId].lastServiceDate = closed || created || null;
      } else {
        pending++;
        byStaff[staffId].pending++;
        byStaff[staffId].lastServiceDate = created || null;
      }
    });

    const staffData = Object.keys(byStaff)
      .map((k) => {
        const s = byStaff[k];
        const avgDur =
          s.selesai > 0 ? s.durasi / s.selesai / (1000 * 60 * 60) : 0; // jam
        return {
          id: k,
          name: s.name,
          division: s.division,
          count: s.count,
          done: s.done,
          pending: s.pending,
          avgTime: avgDur.toFixed(1),
          lastServiceDate: s.lastServiceDate,
        };
      })
      .filter((s) => {
        if (divisionFilter === "all") return true;
        return s.division?.toLowerCase() === divisionFilter.toLowerCase();
      });

    return { total, done, pending, staffData };
  }, [filtered, staffList, divisionFilter]);

  // =======================
  // 🔹 Chart Data
  // =======================
  const barData = summary.staffData.map((s) => ({
    name: s.name,
    value: s.count,
  }));

  const pieData = [
    { name: "Selesai", value: summary.done, color: "#10B981" },
    { name: "Pending", value: summary.pending, color: "#F59E0B" },
  ];

  if (loading)
    return <div className="flex justify-center py-24 text-gray-600">Memuat data...</div>;

  // =======================
  // 🔹 UI Rendering
  // =======================
  return (
    <>
      <NavbarManagement />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen p-6 md:p-10 bg-gradient-to-b from-gray-50 to-white"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header + Filter Periode */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <Wrench className="text-blue-600" /> Laporan Servis
              </h1>
              <p className="text-gray-500 text-sm">
                Ringkasan aktivitas servis berdasarkan periode waktu
              </p>
            </div>

            <div className="flex gap-2 backdrop-blur-md bg-blue-50/50 border border-blue-100 rounded-xl p-1 shadow-inner">
              {[
                { key: "today", label: "Hari Ini" },
                { key: "week", label: "Minggu Ini" },
                { key: "month", label: "Bulan Ini" },
                { key: "all", label: "Semua" },
              ].map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => setPeriod(btn.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    period === btn.key
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-blue-700 hover:bg-blue-100/60 backdrop-blur-sm"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ringkasan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              {
                label: "Total Servis",
                value: summary.total,
                icon: <Wrench className="text-blue-600" />,
                bg: "bg-blue-50",
              },
              {
                label: "Servis Selesai",
                value: summary.done,
                icon: <CheckCircle className="text-green-600" />,
                bg: "bg-green-50",
              },
              {
                label: "Servis Pending",
                value: summary.pending,
                icon: <Clock className="text-yellow-600" />,
                bg: "bg-yellow-50",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4 }}
                className="p-5 bg-white border rounded-xl shadow"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${item.bg}`}>{item.icon}</div>
                  <div>
                    <div className="text-xs text-gray-500">{item.label}</div>
                    <div className="text-2xl font-bold text-gray-800">{item.value}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Grafik */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-2 bg-white border rounded-xl p-4 shadow">
              <h3 className="font-semibold text-gray-800 mb-3">Servis per Staff</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ left: 30, right: 20 }}>
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={160} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 6, 6]}>
                      <LabelList dataKey="value" position="right" fill="#1e3a8a" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-4 shadow">
              <h3 className="font-semibold text-gray-800 mb-3">Status Servis</h3>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label
                    >
                      {pieData.map((p, i) => (
                        <Cell key={i} fill={p.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detail Per Teknisi */}
          <div className="mt-10 bg-white/80 backdrop-blur-lg border border-blue-100 rounded-xl shadow-lg p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <User className="text-blue-500" size={18} /> Detail Per Teknisi
              </h3>

              <select
                onChange={(e) => setDivisionFilter(e.target.value)}
                className="border border-blue-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-300 outline-none"
              >
                <option value="all">Semua Divisi</option>
                {/* auto generate berdasarkan data user */}
                {[...new Set(staffList.map((s) => s.division))].map(
                  (div) =>
                    div &&
                    div !== "-" && (
                      <option key={div} value={div}>
                        {div}
                      </option>
                    )
                )}
              </select>
            </div>

            <table className="w-full text-sm">
              <thead className="text-left text-xs text-gray-500 border-b">
                <tr>
                  <th className="pb-2">Teknisi</th>
                  <th className="pb-2">Divisi</th>
                  <th className="pb-2">Total</th>
                  <th className="pb-2 text-green-700">Selesai</th>
                  <th className="pb-2 text-yellow-700">Pending</th>
                  <th className="pb-2">Rata-rata (jam)</th>
                  <th className="pb-2">% Sukses</th>
                  <th className="pb-2">Aktivitas Terakhir</th>
                </tr>
              </thead>
              <tbody>
                {summary.staffData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-gray-500 italic">
                      Belum ada data servis untuk periode ini.
                    </td>
                  </tr>
                ) : (
                  summary.staffData.map((s) => {
                    const percent = Math.round((s.done / s.count) * 100);
                    const isUnknown = s.name.toLowerCase().includes("unknown");
                    return (
                      <tr
                        key={s.id}
                        className="border-b hover:bg-blue-50/30 transition cursor-pointer"
                        onClick={() =>
                          !isUnknown && router.push(`/management/laporan/teknisi/${s.id}`)
                        }
                        title={`Klik untuk lihat detail ${s.name}`}
                      >
                        <td
                          className={`py-2 font-medium ${
                            isUnknown ? "text-gray-400 italic" : "text-blue-700 hover:underline"
                          }`}
                        >
                          {isUnknown ? "Belum Ditetapkan" : s.name}
                        </td>
                        <td className="py-2">{s.division}</td>
                        <td className="py-2">{s.count}</td>
                        <td className="py-2 text-green-600 font-semibold">{s.done}</td>
                        <td className="py-2 text-yellow-600 font-semibold">{s.pending}</td>
                        <td className="py-2">{s.avgTime}</td>
                        <td
                          className={`py-2 font-semibold ${
                            percent >= 80
                              ? "text-green-600"
                              : percent >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {percent}%
                        </td>
                        <td className="py-2 text-gray-600">
                          {s.lastServiceDate ? formatDate(s.lastServiceDate) : "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </>
  );
}

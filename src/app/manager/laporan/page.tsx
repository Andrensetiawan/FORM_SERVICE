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
import { collection, getDocs, query, Timestamp, where } from "firebase/firestore";
import { Wrench, CheckCircle, Clock, User } from "lucide-react";
import NavbarSwitcher from "@/components/navbars/NavbarSwitcher";
import { useRouter } from "next/navigation";

// =======================
// 🔹 Type Declaration
// =======================
type ServiceDoc = {
  id?: string;
  status?: string;
  assignedTechnician?: string; // Changed from assignedTo to assignedTechnician
  assignedName?: string;
  timestamp?: any; // Changed from createdAt to timestamp
  closedAt?: any;
};

type StaffInfo = {
  id: string;
  uid: string;
  name: string;
  division?: string;
  email?: string; // Added email field
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
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month" | "all">("all");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [divisionFilter, setDivisionFilter] = useState<string>("all");

  // =======================
  // 🔸 Ambil Data Firestore
  // =======================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let serviceQuery = query(collection(db, "service_requests"));

        const now = new Date();
        const nowUtc = new Date(now.toISOString()); // Get current date/time in UTC string, then parse it back as a Date object to ensure UTC interpretation

        let queryStartDate: Date | null = null;
        let queryEndDate: Date | null = null;

        if (selectedPeriod === "today") {
          queryStartDate = new Date(Date.UTC(nowUtc.getFullYear(), nowUtc.getMonth(), nowUtc.getDate())); // Start of today in UTC
          queryEndDate = new Date(Date.UTC(nowUtc.getFullYear(), nowUtc.getMonth(), nowUtc.getDate(), 23, 59, 59, 999)); // End of today in UTC
        } else if (selectedPeriod === "week") {
          const dayOfWeek = nowUtc.getUTCDay(); // 0 for Sunday, 1 for Monday
          const diff = nowUtc.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday of the current UTC week

          queryStartDate = new Date(Date.UTC(nowUtc.getFullYear(), nowUtc.getMonth(), diff));
          queryEndDate = new Date(Date.UTC(nowUtc.getFullYear(), nowUtc.getMonth(), diff + 6, 23, 59, 59, 999)); // End of Sunday of the current UTC week
        } else if (selectedPeriod === "month") {
          queryStartDate = new Date(Date.UTC(nowUtc.getFullYear(), nowUtc.getMonth(), 1)); // Start of the month in UTC
          queryEndDate = new Date(Date.UTC(nowUtc.getFullYear(), nowUtc.getMonth() + 1, 0, 23, 59, 59, 999)); // End of the month in UTC
        }

        console.log("Fetching services for period:", selectedPeriod);
        console.log("Query Start Date:", queryStartDate?.toISOString() || "N/A");
        console.log("Query End Date:", queryEndDate?.toISOString() || "N/A");

        if (queryStartDate && queryEndDate) {
          serviceQuery = query(serviceQuery, where("timestamp", ">=", Timestamp.fromDate(queryStartDate)), where("timestamp", "<=", Timestamp.fromDate(queryEndDate))); // Changed to 'timestamp'
        }

        const snaps = await getDocs(serviceQuery);
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
          email: (u.data().email as string) || undefined, // Fetch email field
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
  }, [selectedPeriod]); // Removed startDate and endDate from dependencies to avoid redundant fetches

  // =======================
  // 🔸 Filter Periode (client-side, now only for division)
  // =======================
  const filtered = useMemo(() => {
    let currentServices = services;
    
    // Apply division filter client-side
    currentServices = currentServices.filter((s) => {
      if (divisionFilter === "all") return true;
      const staff = staffList.find(x => x.uid === s.assignedTechnician || x.id === s.assignedTechnician || x.email === s.assignedTechnician); // Added email matching
      return staff?.division?.toLowerCase() === divisionFilter.toLowerCase();
    });

    return currentServices;
  }, [services, divisionFilter, staffList]);

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

              const staffIdentifier = s.assignedTechnician;

              

              let staffInfo = null;

        

              // Try to find staff by primary identifier (assignedTechnician: uid, id, or email)

              if (staffIdentifier) {

                staffInfo = staffList.find(

                  (x) => x.uid === staffIdentifier || x.id === staffIdentifier || x.email === staffIdentifier

                );

              }

        

              // If no staff found by identifier, but assignedName is present, try to find by name

              if (!staffInfo && s.assignedName) {

                staffInfo = staffList.find(

                  (x) => x.name === s.assignedName // Find by name as a fallback

                );

              }

        

              const effectiveStaffId = staffInfo ? (staffInfo.uid || staffInfo.id) : "unknown"; // Force to "unknown" if no staffInfo found

        

              if (!byStaff[effectiveStaffId]) {

                byStaff[effectiveStaffId] = {

                            name: (staffInfo?.name && staffInfo.name !== "Unknown")

                              ? staffInfo.name

                              : (s.assignedTechnician || "Unknown"), // Use assignedTechnician if staffInfo not found or its name is Unknown

                            division: staffInfo?.division || "-",

                  count: 0,

                  done: 0,

                  pending: 0,

                  durasi: 0,

                  selesai: 0,

                  lastServiceDate: null,

                };

              }      

              byStaff[effectiveStaffId].count++;

      const created =
        s.timestamp instanceof Timestamp
          ? s.timestamp.toDate()
          : s.timestamp
          ? new Date(s.timestamp)
          : null;
      const closed =
        s.closedAt instanceof Timestamp
          ? s.closedAt.toDate()
          : s.closedAt
          ? new Date(s.closedAt)
          : null;

      // Determine the current service's relevant date
      const currentServiceDate = closed || created || null;

      // Update lastServiceDate only if it's the latest
      if (currentServiceDate) {
        if (!byStaff[effectiveStaffId].lastServiceDate || currentServiceDate > byStaff[effectiveStaffId].lastServiceDate) {
          byStaff[effectiveStaffId].lastServiceDate = currentServiceDate;
        }
      }

      if (status.includes("done") || status.includes("selesai")) {
        done++;
        byStaff[effectiveStaffId].done++;
        if (created && closed && closed >= created) {
          const durasi = closed.getTime() - created.getTime();
          byStaff[effectiveStaffId].durasi += durasi;
          byStaff[effectiveStaffId].selesai++;
        }
        byStaff[effectiveStaffId].lastServiceDate = closed || created || null;
      } else {
        pending++;
        byStaff[effectiveStaffId].pending++;
        byStaff[effectiveStaffId].lastServiceDate = created || null;
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

  const exportToCsv = () => {
    const headers = [
      "Teknisi",
      "Divisi",
      "Total",
      "Selesai",
      "Pending",
      "Rata-rata (jam)",
      "Persen Sukses",
      "Aktivitas Terakhir",
    ];

    const csvRows = [
      headers.join(","),
      ...summary.staffData.map((s) =>
        [
          `"${s.name}"`,
          `"${s.division}"`,
          s.count,
          s.done,
          s.pending,
          s.avgTime,
          `${Math.round((s.done / s.count) * 100)}%`,
          s.lastServiceDate ? formatDate(s.lastServiceDate) : "-",
        ].join(",")
      ),
    ];

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `laporan_servis_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading)
    return <div className="flex justify-center py-24 text-gray-600">Memuat data...</div>;

  // =======================
  // 🔹 UI Rendering
  // =======================
  return (
    <>
      <NavbarSwitcher />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen p-6 md:p-10 bg-gray-100 text-gray-800"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header + Filter Periode */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Wrench className="text-blue-600" /> Laporan Servis
              </h1>
              <p className="text-gray-600 text-sm">
                Ringkasan aktivitas servis berdasarkan periode waktu
              </p>
            </div>

            <div className="flex flex-wrap gap-2 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => {
                  const today = new Date();
                  setStartDate(today.toISOString().split("T")[0]);
                  setEndDate(today.toISOString().split("T")[0]);
                  setSelectedPeriod("today");
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  selectedPeriod === "today"
                    ? "bg-blue-600 text-white shadow"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  const firstDayOfWeek = new Date(
                    now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
                  );
                  const lastDayOfWeek = new Date(
                    now.setDate(now.getDate() - now.getDay() + 7)
                  );
                  setStartDate(firstDayOfWeek.toISOString().split("T")[0]);
                  setEndDate(lastDayOfWeek.toISOString().split("T")[0]);
                  setSelectedPeriod("week");
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  selectedPeriod === "week"
                    ? "bg-blue-600 text-white shadow"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                Minggu Ini
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]);
                  setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]);
                  setSelectedPeriod("month");
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  selectedPeriod === "month"
                    ? "bg-blue-600 text-white shadow"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                Bulan Ini
              </button>
              <button
                onClick={() => {
                  setStartDate(null);
                  setEndDate(null);
                  setSelectedPeriod("all");
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  selectedPeriod === "all"
                    ? "bg-blue-600 text-white shadow"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                Semua
              </button>
            </div>
          </div>

          <div className="flex justify-end mb-4">
            <button
              onClick={exportToCsv}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors duration-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                />
              </svg>
              Export CSV
            </button>
          </div>

          {/* Ringkasan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              {
                label: "Total Servis",
                value: summary.total,
                icon: <Wrench className="text-blue-600" />,
                bg: "bg-blue-100",
              },
              {
                label: "Servis Selesai",
                value: summary.done,
                icon: <CheckCircle className="text-green-600" />,
                bg: "bg-green-100",
              },
              {
                label: "Servis Pending",
                value: summary.pending,
                icon: <Clock className="text-yellow-600" />,
                bg: "bg-yellow-100",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4 }}
                className="p-5 bg-white border border-gray-200 rounded-xl shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${item.bg}`}>{item.icon}</div>
                  <div>
                    <div className="text-xs text-gray-500">{item.label}</div>
                    <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Grafik */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-4 shadow-md">
              <h3 className="font-semibold text-gray-800 mb-3">Servis per Staff</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ left: 30, right: 20 }}>
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={160} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#007bff" radius={[6, 6, 6, 6]}>
                      <LabelList dataKey="value" position="right" fill="#1e3a8a" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-md">
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
          <div className="mt-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <User className="text-blue-500" size={18} /> Detail Per Teknisi
              </h3>

              <select
                onChange={(e) => setDivisionFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-300 outline-none"
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
              <thead className="text-left text-xs text-gray-500 border-b-2 border-gray-200">
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
                        className="border-b border-gray-200 hover:bg-gray-100 transition cursor-pointer"
                        onClick={() =>
                          !isUnknown && router.push(`/manager/laporan/teknisi/${s.id}`)
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
                        <td className="py-2 text-gray-700">{s.division}</td>
                        <td className="py-2 text-gray-700">{s.count}</td>
                        <td className="py-2 text-green-600 font-semibold">{s.done}</td>
                        <td className="py-2 text-yellow-600 font-semibold">{s.pending}</td>
                        <td className="py-2 text-gray-700">{s.avgTime}</td>
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


        </div> {/* This closes the div className="max-w-7xl mx-auto" */}
      </motion.div>
    </>
  );
}

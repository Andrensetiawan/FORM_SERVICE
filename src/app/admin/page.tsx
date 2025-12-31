"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import NavbarSwitcher from "@/components/navbars/NavbarSwitcher";
import { ROLES } from "@/lib/roles";
import Link from "next/link";

import {
  Building2,
  Database,
  LogOut,
  Settings,
  Users,
  FilePlus,
} from "lucide-react";

import { db } from "@/lib/firebaseConfig";
import {
  collection,
  query,
  where,
  getCountFromServer,
  getDocs
} from "firebase/firestore";

export default function AdminDashboard() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  // ============================================
  // STATE
  // ============================================
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCabang: 0,
    totalRequests: 0,
    pendingApprovals: 0,
  });

  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // ============================================
  // STATE
  // ============================================

  // ============================================
  // FETCH STATS (Optimized)
  // ============================================
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);

      const usersSnap = await getCountFromServer(query(collection(db, "users")));
      const requestSnap = await getCountFromServer(
        query(collection(db, "service_requests"))
      );

      const pendingSnap = await getCountFromServer(
        query(collection(db, "users"), where("approved", "==", false))
      );

      const reqDocs = await getDocs(collection(db, "service_requests"));
      const cabangSet = new Set<string>();
      reqDocs.forEach((d) => {
        const data = d.data() as any;
        if (data?.cabang) cabangSet.add(String(data.cabang));
      });

      setStats({
        totalUsers: usersSnap.data().count ?? 0,
        totalRequests: requestSnap.data().count ?? 0,
        pendingApprovals: pendingSnap.data().count ?? 0,
        totalCabang: cabangSet.size,
      });
    } catch (err: any) {
      console.error("Failed to fetch admin stats:", err);
      setStatsError("Gagal memuat data dashboard.");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && (role === ROLES.ADMIN || role === ROLES.OWNER || role === ROLES.MANAGER)) {
      fetchStats();
    }
  }, [loading, role, fetchStats]);

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Memuat...
      </div>
    );
  }

  // ============================================
  // MENU LIST
  // ============================================
  const adminMenus = [
    {
      title: "Buat Form Service",
      desc: "Buat permintaan layanan baru untuk customer",
      icon: <FilePlus size={32} className="text-teal-500" />,
      href: "/formservice",
      color: "from-teal-50 to-teal-100",
    },
    {
      title: "Manajemen Pengguna",
      desc: "Kelola role, approval & data staff",
      icon: <Users size={32} className="text-blue-500" />,
      href: "/admin/users",
      color: "from-blue-50 to-blue-100",
    },
    {
      title: "Manajemen Cabang",
      desc: "Kelola data cabang & lokasi",
      icon: <Building2 size={32} className="text-green-500" />,
      href: "/admin/cabang",
      color: "from-green-50 to-green-100",
    },
    {
      title: "Database",
      desc: "Backup & analisis data",
      icon: <Database size={32} className="text-purple-500" />,
      href: "/admin/database",
      color: "from-purple-50 to-purple-100",
    },
    {
      title: "Audit Log",
      desc: "Riwayat aktivitas sistem",
      icon: <LogOut size={32} className="text-orange-500" />,
      href: "/admin/logs",
      color: "from-orange-50 to-orange-100",
    },
    {
      title: "Pengaturan Sistem",
      desc: "Konfigurasi & preferensi aplikasi",
      icon: <Settings size={32} className="text-red-500" />,
      href: "/admin/settings",
      color: "from-red-50 to-red-100",
    },
  ];

  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER]}>
      <NavbarSwitcher />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">

          {/* HEADER */}
          <div className="mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900">
              🛡️ Admin Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Kelola sistem, pengguna & data aplikasi Form Service.
            </p>
          </div>

          {/* ERROR */}
          {statsError && (
            <p className="text-red-600 font-semibold mb-4">
              {statsError}
            </p>
          )}

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <StatCard
              title="Total Pengguna"
              value={statsLoading ? "…" : stats.totalUsers}
              color="border-blue-500"
            />
            <StatCard
              title="Total Cabang"
              value={statsLoading ? "…" : stats.totalCabang}
              color="border-green-500"
            />
            <StatCard
              title="Service Requests"
              value={statsLoading ? "…" : stats.totalRequests}
              color="border-purple-500"
            />
            <StatCard
              title="Pending Approval"
              value={statsLoading ? "…" : stats.pendingApprovals}
              color="border-orange-500"
            />
          </div>

          {/* MENU GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {adminMenus.map((m, i) => (
              <Link key={i} href={m.href}>
                <div
                  className={`
                    bg-gradient-to-br ${m.color}
                    rounded-2xl shadow-lg p-8 cursor-pointer
                    hover:shadow-xl hover:scale-105 transition-all duration-300
                  `}
                >
                  <div className="flex items-center justify-between mb-4">
                    {m.icon}
                    <span className="text-2xl text-gray-400">→</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{m.title}</h3>
                  <p className="text-gray-700 text-sm">{m.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* QUICK ACTIONS */}
          <div className="mt-12 bg-white rounded-2xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">⚡ Aksi Cepat</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <QuickButton label="➕ Tambah Pengguna Baru" color="bg-blue-600" onClick={() => router.push('/admin/pending-users')} />
              <QuickButton label="➕ Tambah Cabang" color="bg-green-600" onClick={() => router.push('/admin/cabang')} />
              <QuickButton label="💾 Backup Database" color="bg-purple-600" onClick={() => router.push('/admin/settings/system')} />
            </div>
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}

/* ------------ COMPONENT STAT CARD ------------ */
function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: any;
  color: string;
}) {
  return (
    <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${color}`}>
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );
}

/* ------------ QUICK BUTTON ------------ */
function QuickButton({
  label,
  color,
  onClick,
}: {
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`${color} hover:brightness-110 text-white font-semibold py-3 px-6 rounded-xl transition`}
    >
      {label}
    </button>
  );
}

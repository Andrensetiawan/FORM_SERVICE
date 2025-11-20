"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import NavbarSwitcher from "@/app/components/navbars/NavbarSwitcher";
import { ROLES } from "@/lib/roles";
import { Users, Database, LogOut, Settings, ShieldCheck, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getCountFromServer, getDocs } from "firebase/firestore";

export default function AdminDashboard() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalRequests, setTotalRequests] = useState<number | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // ⛔ Redirect jika bukan admin
  useEffect(() => {
    if (!loading && role !== ROLES.ADMIN) {
      router.replace("/unauthorized");
    }
  }, [role, loading, router]);

  // 🔢 Ambil statistik Firestore
  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      setStatsError(null);

      try {
        const usersSnap = await getCountFromServer(query(collection(db, "users")));
        setTotalUsers(usersSnap.data().count);

        const reqSnap = await getCountFromServer(query(collection(db, "service_requests")));
        setTotalRequests(reqSnap.data().count);

        const pendingSnap = await getCountFromServer(
          query(collection(db, "users"), where("approved", "==", false))
        );
        setPendingApprovals(pendingSnap.data().count);

        await getDocs(collection(db, "service_requests"));
      } catch (err: any) {
        setStatsError("Gagal memuat statistik.");
        console.error(err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Memuat...
      </div>
    );
  }

  const adminMenus = [
    {
      title: "Manajemen Pengguna",
      description: "Kelola role, persetujuan, dan data staff",
      icon: <Users size={32} className="text-blue-500" />,
      href: "/admin-dashboard/users",
      color: "from-blue-50 to-blue-100",
    },
    {
      title: "Database",
      description: "Backup, restore, dan analisis data",
      icon: <Database size={32} className="text-purple-500" />,
      href: "/admin-dashboard/database",
      color: "from-purple-50 to-purple-100",
    },
    {
      title: "Audit Log",
      description: "Lihat history aktivitas dan perubahan sistem",
      icon: <LogOut size={32} className="text-orange-500" />,
      href: "/admin-dashboard/logs",
      color: "from-orange-50 to-orange-100",
    },
    {
      title: "Role & Permission Management",
      description: "Atur hak akses dan peran pengguna (RBAC lengkap)",
      icon: <ShieldCheck size={32} className="text-green-500" />,
      href: "/admin-dashboard/rbac",
      color: "from-green-50 to-green-100",
    },
    {
      title: "Pengaturan Sistem",
      description: "Konfigurasi logo, tema, notifikasi, dan maintenance mode",
      icon: <SlidersHorizontal size={32} className="text-red-500" />,
      href: "/admin-dashboard/settings",
      color: "from-red-50 to-red-100",
    },
  ];

  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16">
        <NavbarSwitcher />

        <div className="w-full max-w-7xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
              🛡️ Admin Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Kelola sistem, pengguna, dan data aplikasi Form Service
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
              <p className="text-gray-500 text-sm">Total Pengguna</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {statsLoading ? "—" : totalUsers}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
              <p className="text-gray-500 text-sm">Service Requests</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {statsLoading ? "—" : totalRequests}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
              <p className="text-gray-500 text-sm">Pending Approval</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {statsLoading ? "—" : pendingApprovals}
              </p>
            </div>
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {adminMenus.map((menu, idx) => (
              <Link key={idx} href={menu.href}>
                <div
                  className={`bg-gradient-to-br ${menu.color} rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 cursor-pointer transform hover:scale-105`}
                >
                  <div className="flex items-center justify-between mb-4">
                    {menu.icon}
                    <span className="text-2xl text-gray-400">→</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{menu.title}</h3>
                  <p className="text-gray-700 text-sm">{menu.description}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-12 bg-white rounded-2xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">⚡ Aksi Cepat</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition">
                ➕ Tambah Pengguna Baru
              </button>
              <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition">
                💾 Backup Database
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import NavbarAdmin from "@/app/components/navbars/NavbarAdmin";
import { ROLES } from "@/lib/roles";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminLogsPage() {
  const { role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role !== ROLES.ADMIN) {
      router.push("/unauthorized");
    }
  }, [role, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Memuat...
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16 lg:ml-64">
        <NavbarAdmin />

        <div className="w-full max-w-6xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-8">
            <Link href="/admin-dashboard" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
              <ArrowLeft size={20} /> Kembali
            </Link>
            <h1 className="text-3xl font-extrabold text-gray-900">📋 Audit Log</h1>
            <p className="text-gray-600 mt-1">Lihat history aktivitas dan perubahan sistem</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input type="text" placeholder="Cari pengguna..." className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <select className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>-- Pilih Aksi --</option>
                <option>Login</option>
                <option>Update</option>
                <option>Delete</option>
              </select>
              <input type="date" className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition">Filter</button>
            </div>
          </div>

          {/* Log Table Placeholder */}
          <div className="bg-white rounded-2xl shadow-md p-8">
            <p className="text-gray-600 text-center py-12">Log aktivitas akan ditampilkan di sini.</p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

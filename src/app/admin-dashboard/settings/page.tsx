"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import NavbarAdmin from "@/app/components/navbars/NavbarAdmin";
import { ROLES } from "@/lib/roles";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function AdminSettingsPage() {
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
            <h1 className="text-3xl font-extrabold text-gray-900">⚙️ Pengaturan Sistem</h1>
            <p className="text-gray-600 mt-1">Konfigurasi aplikasi dan preferensi</p>
          </div>

          {/* Settings Form */}
          <div className="bg-white rounded-2xl shadow-md p-8">
            <form className="space-y-6">
              {/* General Settings */}
              <div className="border-b pb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">📌 Pengaturan Umum</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nama Aplikasi</label>
                    <input type="text" defaultValue="Form Service" className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Versi Aplikasi</label>
                    <input type="text" defaultValue="1.0.0" className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              {/* Email Settings */}
              <div className="border-b pb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">📧 Pengaturan Email</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Admin</label>
                    <input type="email" placeholder="admin@example.com" className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Support</label>
                    <input type="email" placeholder="support@example.com" className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">🔐 Pengaturan Keamanan</h2>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <span className="ml-3 text-gray-700">Require two-factor authentication (2FA) untuk admin</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="w-4 h-4" />
                    <span className="ml-3 text-gray-700">Aktifkan session timeout setelah 30 menit</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <span className="ml-3 text-gray-700">Log semua aktivitas admin</span>
                  </label>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
                <button type="button" className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition">
                  Batal
                </button>
                <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">
                  <Save size={20} /> Simpan Pengaturan
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import NavbarSwitcher from "@/app/components/navbars/NavbarSwitcher";
import { ROLES } from "@/lib/roles";
import { ArrowLeft, Download, Upload } from "lucide-react";
import Link from "next/link";

export default function AdminDatabasePage() {
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16">
        <NavbarSwitcher />

        <div className="w-full max-w-6xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link href="/admin-dashboard" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
                <ArrowLeft size={20} /> Kembali
              </Link>
              <h1 className="text-3xl font-extrabold text-gray-900">💾 Database Management</h1>
              <p className="text-gray-600 mt-1">Backup, restore, dan analisis data</p>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-md p-8">
              <Download size={32} className="text-purple-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Backup Database</h3>
              <p className="text-gray-600 mb-4">Buat backup data Firestore ke file lokal</p>
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition">
                Backup Sekarang
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-8">
              <Upload size={32} className="text-blue-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Restore Database</h3>
              <p className="text-gray-600 mb-4">Restore data dari file backup sebelumnya</p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition">
                Pilih File Backup
              </button>
            </div>
          </div>

          {/* Placeholder */}
          <div className="bg-white rounded-2xl shadow-md p-8">
            <p className="text-gray-600 text-center py-12">Fitur analisis database akan ditampilkan di sini.</p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

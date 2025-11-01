"use client";
import ProtectedRoute from "@/app/components/ProtectedRoute";

export default function StaffDashboard() {
  return (
    <ProtectedRoute allowedRoles={["staff"]}>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-indigo-700">
          Dashboard Staff 🚀
        </h1> 
        <p className="text-gray-600 mt-2">
          Selamat datang di dashboard staff! Semua akses sudah diverifikasi.
        </p>
      </div>
    </ProtectedRoute>
  );
}

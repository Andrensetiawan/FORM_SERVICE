"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import NavbarSwitcher from "@/components/navbars/NavbarSwitcher";
import { ROLES } from "@/lib/roles";
import { ArrowLeft, Download, Upload, FileSpreadsheet } from "lucide-react";
import Link from "next/link";

import { db } from "@/lib/firebaseConfig";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";

import * as XLSX from "xlsx-js-style";


export default function AdminDatabasePage() {
  const { role, loading } = useAuth();
  const router = useRouter();

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "info"
  );

  const showToastMessage = (
    message: string,
    type: "success" | "error" | "info"
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
      setToastMessage("");
    }, 3000); // Hide after 3 seconds
  };

  

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Memuat...
      </div>
    );
  }

  // =============================
  // 🔥 1. BACKUP FIRESTORE → JSON
  // =============================
  const handleBackupJSON = async () => {
    try {
      const collections = ["users", "cabangs", "service_requests", "logs"];
      const backupData: any = {};

      for (const col of collections) {
        const snap = await getDocs(collection(db, col));
        backupData[col] = [];
        snap.forEach((d) =>
          backupData[col].push({ id: d.id, ...d.data() })
        );
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);

      a.href = url;
      a.download = `backup-formservice-${date}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      showToastMessage("✅ Backup JSON berhasil diunduh!", "success");
    } catch (err) {
      console.error(err);
      showToastMessage("❌ Backup gagal!", "error");
    }
  };

  // ==================================
  // 🔥 2. RESTORE JSON → FIRESTORE
  // ==================================
  const handleRestoreJSON = async (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      for (const col in data) {
        for (const item of data[col]) {
          const { id, ...payload } = item;
          await setDoc(doc(db, col, id), payload, { merge: true });
        }
      }

      showToastMessage("✅ Restore JSON sukses!", "success");
    } catch (err) {
      console.error(err);
      showToastMessage("❌ Restore gagal! File tidak valid.", "error");
    }
  };

  // ======================================
  // 🔥 3. EXPORT FIRESTORE → EXCEL (.xlsx)
  // ======================================
  const handleExportExcel = async () => {
    try {
      const collections = ["users", "cabangs", "service_requests", "logs"];
      const excelData: any = {};

      for (const col of collections) {
        const snap = await getDocs(collection(db, col));
        excelData[col] = [];

        snap.forEach((d) => excelData[col].push({ id: d.id, ...d.data() }));
      }

      // === Generate Workbook Excel ===
      const workbook = XLSX.utils.book_new();

      for (const col of collections) {
        const sheet = XLSX.utils.json_to_sheet(excelData[col]);
        XLSX.utils.book_append_sheet(workbook, sheet, col);
      }

      XLSX.writeFile(
        workbook,
        `FormService-Backup-${new Date().toISOString().slice(0, 10)}.xlsx`
      );

      showToastMessage("📊 Export Excel berhasil!", "success");
    } catch (err) {
      console.error(err);
      showToastMessage("❌ Gagal export ke Excel!", "error");
    }
  };

  // ======================================
  // ==== UI PAGE (Sudah Rapi & Smooth) ===
  // ======================================
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER]}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16">
        <NavbarSwitcher />

        <div className="w-full max-w-6xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link
                href="/admin"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
              >
                <ArrowLeft size={20} /> Kembali
              </Link>
              <h1 className="text-3xl font-extrabold text-gray-900">
                📁 Database Management
              </h1>
              <p className="text-gray-600 mt-1">
                Backup, restore, dan export data
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Backup */}
            <div className="bg-white rounded-2xl shadow-md p-8">
              <Download size={32} className="text-purple-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Backup JSON
              </h3>
              <p className="text-gray-600 mb-4">
                Unduh seluruh database dalam format JSON.
              </p>
              <button
                onClick={handleBackupJSON}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition"
              >
                Backup Sekarang
              </button>
            </div>

            {/* Restore */}
            <div className="bg-white rounded-2xl shadow-md p-8">
              <Upload size={32} className="text-blue-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Restore JSON
              </h3>
              <p className="text-gray-600 mb-4">Upload file backup JSON.</p>

              <label className="w-full block">
                <div className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-center cursor-pointer transition">
                  Pilih File JSON
                </div>
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={handleRestoreJSON}
                />
              </label>
            </div>

            {/* Excel Export */}
            <div className="bg-white rounded-2xl shadow-md p-8">
              <FileSpreadsheet size={32} className="text-green-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Export ke Excel
              </h3>
              <p className="text-gray-600 mb-4">Export semua data ke .xlsx</p>
              <button
                onClick={handleExportExcel}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition"
              >
                Export Excel
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-8">
            <p className="text-gray-600 text-center py-12">
              Modul analisis database akan menyusul di versi berikutnya.
            </p>
          </div>

          {showToast && (
            <div
              className={`fixed top-20 right-5 p-4 rounded-lg shadow-lg text-white font-semibold transition-all duration-300 ${
                toastType === "success" ? "bg-green-500" : ""
              } ${toastType === "error" ? "bg-red-500" : ""} ${
                toastType === "info" ? "bg-blue-500" : ""
              }`}
            >
              {toastMessage}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

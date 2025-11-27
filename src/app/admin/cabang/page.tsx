"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import NavbarSwitcher from "@/app/components/navbars/NavbarSwitcher";
import { ROLES } from "@/lib/roles";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

import { db } from "@/lib/firebaseConfig";
import {
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  doc,
} from "firebase/firestore";

import { createLog } from "@/lib/log";

export default function AdminCabangPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const [cabangs, setCabangs] = useState<string[]>([]);
  const [loadingCabangs, setLoadingCabangs] = useState(true);
  const [newCabang, setNewCabang] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ================================================================
  // FETCH CABANGS
  // ================================================================
  const fetchCabangs = useCallback(async () => {
    setLoadingCabangs(true);
    try {
      const snap = await getDocs(collection(db, "cabangs"));
      const arr: string[] = [];

      snap.forEach((d) => {
        const data: any = d.data();
        if (data?.name) arr.push(data.name);
      });

      setCabangs(arr.sort());
    } catch (err) {
      console.error("Failed to fetch cabangs:", err);
    } finally {
      setLoadingCabangs(false);
    }
  }, []);

  useEffect(() => {
    fetchCabangs();
  }, [fetchCabangs]);

  // ================================================================
  // ROLE PROTECTION
  // ================================================================
  useEffect(() => {
    if (!loading && role !== ROLES.ADMIN) {
      router.push("/unauthorized");
    }
  }, [loading, role, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Memuat...
      </div>
    );
  }

  // ================================================================
  // ADD CABANG — FIXED
  // ================================================================
  const handleAddCabang = async () => {
    const name = newCabang.trim();

    if (!name) return alert("Nama cabang tidak boleh kosong.");
    if (cabangs.includes(name)) return alert("Cabang sudah ada!");

    setSaving(true);

    try {
      // 1️⃣ Tambah cabang
      await addDoc(collection(db, "cabangs"), {
        name,
        createdAt: new Date(),
      });

      // 2️⃣ Save logs
      createLog({
        uid: user?.uid ?? "unknown",
        role: role ?? "unknown",
        action: "create_cabang",
        target: name,
      });

      setNewCabang("");
      fetchCabangs();
    } catch (err) {
      console.error("Failed to add cabang:", err);
      alert("Gagal menambah cabang.");
    } finally {
      setSaving(false);
    }
  };

  // ================================================================
  // DELETE CABANG
  // ================================================================
  const handleDeleteCabang = async (cabangName: string) => {
    if (!confirm(`Hapus cabang "${cabangName}"?`)) return;

    setDeletingId(cabangName);

    try {
      const qSnap = await getDocs(
        query(collection(db, "cabangs"), where("name", "==", cabangName))
      );

      for (const d of qSnap.docs) {
        await deleteDoc(doc(db, "cabangs", d.id));
      }

      // LOGGING DELETE
      createLog({
        uid: user?.uid ?? "unknown",
        role: role ?? "unknown",
        action: "delete_cabang",
        target: cabangName,
      });

      fetchCabangs();
    } catch (err) {
      console.error("Failed to delete cabang:", err);
      alert("Gagal menghapus cabang.");
    } finally {
      setDeletingId(null);
    }
  };

  // ================================================================
  // UI FINAL
  // ================================================================
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16">
        <NavbarSwitcher />

        <div className="w-full max-w-6xl mx-auto px-6 py-12">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">🏢 Manajemen Cabang</h1>
              <p className="text-gray-600 mt-1">Kelola data cabang dan lokasi</p>
            </div>

            <button
              onClick={handleAddCabang}
              disabled={saving}
              className={`flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition ${
                saving ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              <Plus size={20} />
              {saving ? "Menyimpan..." : "Tambah Cabang"}
            </button>
          </div>

          {/* Cabang List */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Daftar Cabang</h2>

              <div className="flex items-center gap-2">
                <input
                  value={newCabang}
                  onChange={(e) => setNewCabang(e.target.value)}
                  placeholder="Nama cabang baru"
                  className="border px-3 py-2 rounded-md text-sm bg-white text-gray-800"
                />

                <button
                  onClick={handleAddCabang}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  <Plus size={16} />
                  {saving ? "..." : "Tambah"}
                </button>
              </div>
            </div>

            {loadingCabangs ? (
              <div className="py-6 text-center text-gray-500">Memuat cabang...</div>
            ) : cabangs.length === 0 ? (
              <div className="py-6 text-center text-gray-500">Belum ada cabang terdaftar.</div>
            ) : (
              <ul className="space-y-3">
                {cabangs.map((cabang) => (
                  <li
                    key={cabang}
                    className="flex items-center justify-between border p-3 rounded-md bg-white text-gray-800"
                  >
                    <div className="font-medium">{cabang}</div>

                    <button
                      onClick={() => handleDeleteCabang(cabang)}
                      disabled={deletingId === cabang}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      {deletingId === cabang ? "Menghapus..." : "Hapus"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

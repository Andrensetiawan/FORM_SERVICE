"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import NavbarAdmin from "@/app/components/navbars/NavbarAdmin";
import { ROLES } from "@/lib/roles";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";

export default function AdminCabangPage() {
  const { role, loading } = useAuth();
  const router = useRouter();

  const [cabangs, setCabangs] = useState<string[]>([]);
  const [loadingCabangs, setLoadingCabangs] = useState(true);
  const [newCabang, setNewCabang] = useState("");

  const fetchCabangs = async () => {
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
      console.error("Failed to fetch cabangs", err);
    } finally {
      setLoadingCabangs(false);
    }
  };

  useEffect(() => { fetchCabangs(); }, []);

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
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link href="/admin-dashboard" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
                <ArrowLeft size={20} /> Kembali
              </Link>
              <h1 className="text-3xl font-extrabold text-gray-900">🏢 Manajemen Cabang</h1>
              <p className="text-gray-600 mt-1">Kelola data cabang dan lokasi</p>
            </div>
            <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition">
              <Plus size={20} /> Tambah Cabang
            </button>
          </div>

          {/* Cabang Management */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Daftar Cabang</h2>
              <div className="flex items-center gap-2">
                <input value={newCabang} onChange={(e) => setNewCabang(e.target.value)} placeholder="Nama cabang baru" className="border px-3 py-2 rounded-md text-sm" />
                <button
                  onClick={async () => {
                    if (!newCabang.trim()) return;
                    try {
                      await addDoc(collection(db, "cabangs"), { name: newCabang.trim(), createdAt: new Date() });
                      setNewCabang("");
                      fetchCabangs();
                    } catch (err) {
                      console.error("Failed to add cabang", err);
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  <Plus size={16} /> Tambah
                </button>
              </div>
            </div>

            {loadingCabangs ? (
              <div className="py-6 text-center text-gray-500">Memuat cabang...</div>
            ) : cabangs.length === 0 ? (
              <div className="py-6 text-center text-gray-500">Belum ada cabang terdaftar.</div>
            ) : (
              <ul className="space-y-3">
                {cabangs.map((c) => (
                  <li key={c} className="flex items-center justify-between border p-3 rounded-md">
                    <div className="font-medium">{c}</div>
                    <div>
                      <button
                        onClick={async () => {
                          if (!confirm(`Hapus cabang ${c}?`)) return;
                          try {
                            // find doc id
                            const snap = await getDocs(collection(db, "cabangs"));
                            snap.forEach(async (d) => {
                              const data: any = d.data();
                              if (data?.name === c) {
                                await deleteDoc(doc(db, "cabangs", d.id));
                              }
                            });
                            fetchCabangs();
                          } catch (err) {
                            console.error("Failed to delete cabang", err);
                          }
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >Hapus</button>
                    </div>
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

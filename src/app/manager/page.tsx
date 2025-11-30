"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import useAuth from "@/hooks/useAuth";
import Link from "next/link";
import NavbarSwitcher from "@/app/components/navbars/NavbarSwitcher";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { ROLES } from "@/lib/roles";

// ===== TYPE DEFINITION AGAR TYPE ERROR MENGHILANG =====
type ServiceRequest = {
  id: string;
  timestamp?: { seconds: number };
  track_number?: string;
  status?: string;
  nama?: string;
  no_hp?: string;
  tipe?: string;
  teknisi?: string | null;
  cabang?: string | null;
};

export default function StaffManagementPage() {
  const { user, role, loading } = useAuth();

  const [data, setData] = useState<ServiceRequest[]>([]);
  const [filtered, setFiltered] = useState<ServiceRequest[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [selectedTeknisi, setSelectedTeknisi] = useState("");
  const [selectedCabang, setSelectedCabang] = useState("Semua");
  const [showEntries, setShowEntries] = useState(10);

  const [teknisiOptions, setTeknisiOptions] = useState<string[]>([]);
  const [cabangOptions, setCabangOptions] = useState<string[]>([]);

  // =======================================
  // FETCH DATA
  // =======================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await getDocs(collection(db, "service_requests"));
        const arr: ServiceRequest[] = snap.docs
          .map((doc) => {
            const dat = doc.data() as any;
            return {
              ...dat,
              id: doc.id,
            };
          })
          .sort((a, b) => (b.timestamp?.seconds ?? 0) - (a.timestamp?.seconds ?? 0)); // 🔥 Sort terbaru ke terlama


        setData(arr);
        setFiltered(arr);

        // Dropdown dynamic teknisi dan cabang
        setTeknisiOptions([
          ...new Set(arr.map((i) => i.teknisi || "-")),
        ]);

        setCabangOptions([
          "Semua",
          ...new Set(arr.map((i) => i.cabang || "-")),
        ]);
      } catch (error) {
        console.error("❌ Gagal ambil data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    if (!loading && user && role) fetchData();
  }, [loading, user, role]);

  // =======================================
  // FILTER LOGIC
  // =======================================
  useEffect(() => {
    let result = data;

    if (selectedTeknisi)
      result = result.filter((i) => i.teknisi === selectedTeknisi);

    if (selectedCabang !== "Semua")
      result = result.filter((i) => i.cabang === selectedCabang);

    setFiltered(result);
  }, [selectedTeknisi, selectedCabang, data]);

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-200">
        Loading data...
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[ROLES.STAFF, ROLES.MANAGER, ROLES.OWNER, ROLES.ADMIN]}>
      <div className="min-h-screen bg-[#0d1117] text-white">
        <NavbarSwitcher />

        <div className="p-6 max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-extrabold text-blue-400">
              Daftar Service Request
            </h1>
            <p className="text-sm text-gray-300">
              Role kamu:
              <span className="text-blue-400 font-semibold"> {role?.toUpperCase()}</span>
            </p>
          </div>

          {/* FILTER */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Teknisi */}
              <div>
                <label className="text-sm text-gray-300">Teknisi</label>
                <select
                  value={selectedTeknisi}
                  onChange={(e) => setSelectedTeknisi(e.target.value)}
                  className="w-full mt-1 p-2 rounded bg-gray-900 text-gray-200 border border-gray-700"
                >
                  <option value="">Semua Teknisi</option>
                  {teknisiOptions.map((t, i) => (
                    <option key={i} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Cabang */}
              <div>
                <label className="text-sm text-gray-300">Cabang</label>
                <select
                  value={selectedCabang}
                  onChange={(e) => setSelectedCabang(e.target.value)}
                  className="w-full mt-1 p-2 rounded bg-gray-900 text-gray-200 border border-gray-700"
                >
                  {cabangOptions.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Show Entries */}
              <div>
                <label className="text-sm text-gray-300">Tampilkan</label>
                <input
                  type="number"
                  min={1}
                  value={showEntries}
                  onChange={(e) => setShowEntries(Number(e.target.value))}
                  className="w-full mt-1 p-2 rounded bg-gray-900 text-gray-200 border border-gray-700"
                />
              </div>
            </div>
          </div>

          {/* TABLE */}
          {filtered.length === 0 ? (
            <div className="text-center text-gray-300 py-20">Tidak ada data ditemukan.</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-700 bg-gray-800">
              <table className="w-full text-sm text-gray-200">
                <thead className="bg-blue-700 text-white uppercase text-xs">
                  <tr>
                    <th className="p-3">Tanggal Masuk</th>
                    <th className="p-3">Tracking</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">No HP</th>
                    <th className="p-3">Tipe</th>
                    <th className="p-3">Cabang</th>
                    <th className="p-3">Teknisi</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.slice(0, showEntries).map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-700/40">
                      <td className="p-3">
                        {item.timestamp?.seconds
                          ? new Date(item.timestamp.seconds * 1000).toLocaleString("id-ID", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "-"}
                      </td>

                      <td className="p-3 text-blue-400 font-semibold">
                        <Link href={`/tns/${item.id}`} className="hover:underline">
                          {item.track_number || `WO${idx + 1}`}
                        </Link>
                      </td>

                      <td className="p-3 text-yellow-400">{item.status || "-"}</td>
                      <td className="p-3">{item.nama || "-"}</td>
                      <td className="p-3">{item.no_hp || "-"}</td>
                      <td className="p-3">{item.tipe || "-"}</td>
                      <td className="p-3">{item.cabang || "-"}</td>
                      <td className="p-3">{item.teknisi || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

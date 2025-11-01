"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import useAuth from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/navbar";

export default function AdminPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [selectedCabang, setSelectedCabang] = useState("");
  const [selectedTeknisi, setSelectedTeknisi] = useState("");
  const [showEntries, setShowEntries] = useState(10);

  // 🔒 Akses terbatas
  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (!["staff", "manager", "owner"].includes(role || ""))
        router.push("/unauthorized");
    }
  }, [user, role, loading, router]);

  // 🔥 Ambil data Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "service_requests"));
        const items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setData(items);
        setFiltered(items);
      } catch (error: any) {
        console.error("❌ Gagal ambil data:", error.message);
      } finally {
        setLoadingData(false);
      }
    };

    if (!loading && user && role) fetchData();
  }, [loading, user, role]);

  // Filter
  const cabangOptions = [...new Set(data.map((item) => item.cabang || "-"))];
  const teknisiOptions = [...new Set(data.map((item) => item.teknisi || "-"))];

  useEffect(() => {
    let filteredData = data;
    if (selectedCabang)
      filteredData = filteredData.filter(
        (item) => item.cabang === selectedCabang
      );
    if (selectedTeknisi)
      filteredData = filteredData.filter(
        (item) => item.teknisi === selectedTeknisi
      );
    setFiltered(filteredData);
  }, [selectedCabang, selectedTeknisi, data]);

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-300">
        Loading data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      <Navbar />
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-blue-400 tracking-tight">
              Daftar Service Request
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Kelola dan pantau seluruh aktivitas service pelanggan
            </p>
          </div>
          <p className="text-sm text-gray-400 italic">
            Role kamu:{" "}
            <span className="text-blue-400 font-semibold">
              {role?.toUpperCase()}
            </span>
          </p>
        </div>

        {/* Filter */}
        {(role === "manager" || role === "owner") && (
          <div className="bg-gray-800/70 border border-gray-700 rounded-2xl shadow-md p-5 mb-8 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Cabang */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Cabang
                </label>
                <select
                  value={selectedCabang}
                  onChange={(e) => setSelectedCabang(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">- Pilih Cabang -</option>
                  {cabangOptions.map((cabang, i) => (
                    <option key={i} value={cabang}>
                      {cabang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teknisi */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Teknisi
                </label>
                <select
                  value={selectedTeknisi}
                  onChange={(e) => setSelectedTeknisi(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">- Pilih Teknisi -</option>
                  {teknisiOptions.map((t, i) => (
                    <option key={i} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Show Entries */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Tampilkan
                </label>
                <input
                  type="number"
                  value={showEntries}
                  min="1"
                  onChange={(e) => setShowEntries(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Download */}
              <div className="flex items-end">
                <button
                  onClick={() => alert("📁 Fitur Download CSV segera hadir")}
                  className="bg-blue-600 hover:bg-blue-700 transition px-4 py-2.5 rounded-lg w-full font-semibold shadow"
                >
                  Download CSV
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            Tidak ada data ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto shadow-lg rounded-2xl border border-gray-700 bg-gray-800/60 backdrop-blur-sm">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-blue-700 text-white uppercase text-xs">
                <tr>
                  <th className="p-3 border-b border-gray-700">Tanggal Masuk</th>
                  <th className="p-3 border-b border-gray-700">Tracking</th>
                  <th className="p-3 border-b border-gray-700">Status</th>
                  <th className="p-3 border-b border-gray-700">Customer</th>
                  <th className="p-3 border-b border-gray-700">No HP</th>
                  <th className="p-3 border-b border-gray-700">Tipe</th>
                  <th className="p-3 border-b border-gray-700">Teknisi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, showEntries).map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-700/40 transition duration-200"
                  >
                    <td className="p-3 border-b border-gray-700 text-gray-300">
                      {item.timestamp?.seconds
                        ? new Date(item.timestamp.seconds * 1000).toLocaleString(
                            "id-ID",
                            { dateStyle: "short", timeStyle: "medium" }
                          )
                        : "-"}
                    </td>
                    <td className="p-3 border-b border-gray-700 text-blue-400 font-semibold">
                      <Link href={`/staff/tns/${item.id}`} className="hover:underline">
                        WO{index + 1}
                      </Link>
                    </td>
                    <td className="p-3 border-b border-gray-700 text-yellow-400">
                      {item.status || "-"}
                    </td>
                    <td className="p-3 border-b border-gray-700 text-gray-200">
                      {item.nama || "-"}
                    </td>
                    <td className="p-3 border-b border-gray-700 text-gray-300">
                      {item.no_hp || "-"}
                    </td>
                    <td className="p-3 border-b border-gray-700 text-gray-300">
                      {item.tipe || "-"}
                    </td>
                    <td className="p-3 border-b border-gray-700 text-gray-300">
                      {item.teknisi || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

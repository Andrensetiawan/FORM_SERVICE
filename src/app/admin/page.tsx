"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import Navbar from "@/app/components/navbar";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import Link from "next/link";

export default function AdminPage() {
  const [data, setData] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCabang, setSelectedCabang] = useState("");
  const [selectedTeknisi, setSelectedTeknisi] = useState("");
  const [showEntries, setShowEntries] = useState(10);

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
      } catch (error) {
        console.error("❌ Gagal ambil data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  return (
    <ProtectedRoute>
      <div>
        <Navbar />
        <div className="min-h-screen bg-gray-900 text-white p-6">
          {/* Filter Section */}
          <div className="bg-gray-800 p-4 rounded-xl mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Cabang</label>
                <select
                  value={selectedCabang}
                  onChange={(e) => setSelectedCabang(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                >
                  <option value="">- Pilih Cabang -</option>
                  {cabangOptions.map((cabang, index) => (
                    <option key={index} value={cabang}>
                      {cabang}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Teknisi</label>
                <select
                  value={selectedTeknisi}
                  onChange={(e) => setSelectedTeknisi(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                >
                  <option value="">- Pilih Teknisi -</option>
                  {teknisiOptions.map((teknisi, index) => (
                    <option key={index} value={teknisi}>
                      {teknisi}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Show</label>
                <input
                  type="number"
                  value={showEntries}
                  min="1"
                  onChange={(e) => setShowEntries(Number(e.target.value))}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => alert("Fitur Download CSV segera hadir 📁")}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded w-full"
                >
                  Download CSV
                </button>
              </div>
            </div>
          </div>

          {/* Tabel */}
          {loading ? (
            <p className="text-center text-gray-400">Mengambil data...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-400">Tidak ada data ditemukan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-700 text-sm">
                <thead>
                  <tr className="bg-blue-700">
                    <th className="p-2 border">Tanggal Masuk</th>
                    <th className="p-2 border">Tracking Number</th>
                    <th className="p-2 border">Status Order</th>
                    <th className="p-2 border">Customer</th>
                    <th className="p-2 border">No HP</th>
                    <th className="p-2 border">Tipe</th>
                    <th className="p-2 border">Teknisi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, showEntries).map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-800">
                      <td className="p-2 border">
                        {item.timestamp?.seconds
                          ? new Date(item.timestamp.seconds * 1000).toLocaleString()
                          : "-"}
                      </td>
                      <td className="p-2 border text-blue-400 font-semibold">
                        <Link href={`/admin/${item.id}`} className="hover:underline">
                          WO{index + 1}
                        </Link>
                      </td>
                      <td className="p-2 border">{item.status || "-"}</td>
                      <td className="p-2 border">{item.nama || "-"}</td>
                      <td className="p-2 border">{item.no_hp || "-"}</td>
                      <td className="p-2 border">{item.tipe || "-"}</td>
                      <td className="p-2 border">{item.teknisi || "-"}</td>
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

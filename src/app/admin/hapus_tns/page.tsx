"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import useAuth from "@/hooks/useAuth";
import Link from "next/link";
import NavbarSwitcher from "@/components/navbars/NavbarSwitcher";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ROLES } from "@/lib/roles";

const getTime = (t: any) => {
  if (!t) return 0;
  if (typeof t === "number") return t;
  if (t._seconds) return t._seconds;
  if (t.seconds) return t.seconds;
  if (t.toDate) return Math.floor(t.toDate().getTime() / 1000);
  return 0;
};

type ServiceRequest = {
  id: string;
  timestamp?: { seconds: number; _seconds?: number };
  track_number?: string;
  status?: string;
  nama?: string;
  no_hp?: string;
  tipe?: string;
  assignedTechnician?: string | null;

  cabang?: string | null;
};

export default function StaffPage() {
  const { loading } = useAuth();

  const [data, setData] = useState<ServiceRequest[]>([]);
  const [filtered, setFiltered] = useState<ServiceRequest[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [filterTeknisi, setFilterTeknisi] = useState("Semua");
  const [filterCabang, setFilterCabang] = useState("Semua");

  const [rowsPerPage, setRowsPerPage] = useState<string>("10");
  const [searchText, setSearchText] = useState("");

  const [teknisiOptions, setTeknisiOptions] = useState<string[]>([]);
  const [cabangOptions, setCabangOptions] = useState<string[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, track_number: string | undefined} | null>(null);


  // =======================================
  // DELETE TNS
  // =======================================
  const openConfirmationModal = (id: string, track_number: string | undefined) => {
    setItemToDelete({ id, track_number });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteDoc(doc(db, "service_requests", itemToDelete.id));
      const newData = data.filter((item) => item.id !== itemToDelete.id);
      setData(newData);
    } catch (error) {
      console.error("Error deleting document: ", error);
      alert("Gagal menghapus TNS. Lihat konsol untuk detail.");
    } finally {
      setIsModalOpen(false);
      setItemToDelete(null);
    }
  };

  // =======================================
  // FETCH DATA FROM FIRESTORE
  // =======================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch all users to create a technician email to division map
        const usersSnapshot = await getDocs(collection(db, "users"));
        const technicianDivisionMap = new Map<string, string>();


        usersSnapshot.docs.forEach((doc) => {
          const userData = doc.data() as any;
          if (userData.role && (userData.role.toLowerCase() === ROLES.STAFF || userData.role.toLowerCase() === ROLES.MANAGER) && userData.email && userData.division) {
            technicianDivisionMap.set(userData.email, userData.division);

          }
        });

        // 2. Fetch service requests
        const snap = await getDocs(collection(db, "service_requests"));
        const arr: ServiceRequest[] = snap.docs
          .map((doc) => {
            const dat = doc.data() as any;
            const assignedTechnicianEmail = dat.assignedTechnician;
            const assignedTechnicianDivision = assignedTechnicianEmail ? technicianDivisionMap.get(assignedTechnicianEmail) : null;

            return {
              ...dat,
              id: doc.id,
  
            };
          })
          .sort((a, b) => getTime(b.timestamp) - getTime(a.timestamp));

        setData(arr);
        setFiltered(arr);

        const teknisiSet = new Set<string>();
        const cabangSet = new Set<string>();

        arr.forEach((i) => {
          if (i.assignedTechnician) teknisiSet.add(String(i.assignedTechnician).trim().toLowerCase());
          if (i.cabang) cabangSet.add(i.cabang);
        });

        setTeknisiOptions(Array.from(teknisiSet));
        setCabangOptions(Array.from(cabangSet));

      } catch (error) {
        console.error("❌ Gagal ambil data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // =======================================
  // FILTER LOGIC (teknisi, cabang, search)
  // =======================================
  useEffect(() => {
    let result = [...data];

    if (filterTeknisi !== "Semua") {
      result = result.filter(
        (i) => String(i.assignedTechnician || "").trim().toLowerCase() === filterTeknisi.trim().toLowerCase()
      );
    }

    if (filterCabang !== "Semua") {
      result = result.filter((i) =>
        (i.cabang || "")
          .toLowerCase()
          .includes(filterCabang.toLowerCase())
      );
    }



    if (searchText.trim() !== "") {
      const q = searchText.toLowerCase();
      result = result.filter((i) => {
        const combined = [
          i.track_number,
          i.nama,
          i.no_hp,
          i.tipe,
          i.cabang,
          i.assignedTechnician, // Changed from i.teknisi
          i.status,

        ]
          .join(" ")
          .toLowerCase();
        return combined.includes(q);
      });
    }

    setFiltered(result);
  }, [filterTeknisi, filterCabang,, searchText, data]);

  // =======================================
  // DOWNLOAD CSV (SEMUA DATA)
  // =======================================
  const handleDownloadCsv = () => {
    const headers = [
      "Tanggal Masuk",
      "Tracking",
      "Status",
      "Customer",
      "No HP",
      "Tipe",
      "Cabang",
      "Teknisi",
    ];
    const rows: string[] = [];

    rows.push(headers.join(","));

    data.forEach((item) => {
      const tanggal =
        item.timestamp && typeof item.timestamp === "object"
          ? new Date(
              ((item.timestamp as any)._seconds ??
                (item.timestamp as any).seconds ??
                0) * 1000
            ).toLocaleString("id-ID", {
              dateStyle: "short",
              timeStyle: "short",
            })
          : "";

      const cols = [
        tanggal,
        item.track_number ?? "",
        item.status ?? "",
        item.nama ?? "",
        item.no_hp ?? "",
        item.tipe ?? "",
        item.cabang ?? "",
        item.assignedTechnician ?? "", // Changed from item.teknisi
      ].map((value) => {
        let v = String(value).replace(/"/g, '""');
        if (v.includes(",")) v = `"${v}"`;
        return v;
      });

      rows.push(cols.join(","));
    });

    const csv = rows.join("\n");
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filename = `service_requests_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-200">
        Loading data...
      </div>
    );
  }

  // Hitungan baris ditampilkan
  const displayData =
    rowsPerPage === "Semua"
      ? filtered
      : filtered.slice(0, parseInt(rowsPerPage) || filtered.length);

  return (
    <ProtectedRoute
      allowedRoles={[
        ROLES.STAFF,
        ROLES.MANAGER,
        ROLES.OWNER,
        ROLES.ADMIN,
      ]}
    >
      <>
        {/* CSS KHUSUS HALAMAN INI (SAMA PERSIS DENGAN HTML) */}
        <style jsx global>{`
          body {
            background-color: #101727;
            color: #e2e8f0;
          }
          .card {
            background-color: #1e293b;
            box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.4);
            border: 1px solid #2d3748;
          }
          .input-dark,
          .select-dark {
            background-color: #2d3748;
            border-color: #4a5568;
            color: #e2e8f0;
          }
          .table-header {
            background-color: #1f324d;
            color: #cbd5e0;
            border-bottom: 2px solid #3b82f6;
          }
          .table-body-row:nth-child(odd) {
            background-color: #1a2434;
          }
          .table-body-row:nth-child(even) {
            background-color: #1e293b;
          }
          .table-body-row:hover {
            background-color: #2a3d53;
            transition: background-color 0.2s;
          }
          .status-done {
            background-color: #10b981;
            color: #064e3b;
            font-weight: 700;
          }
          .status-pending {
            background-color: #f59e0b;
            color: #78350f;
            font-weight: 700;
          }
          .status-link {
            color: #60a5fa;
            font-weight: 600;
            text-decoration: none;
          }
        `}</style>

        <NavbarSwitcher />

        {isModalOpen && itemToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Konfirmasi Penghapusan</h3>
              <p className="text-gray-300 mb-6">
                Apakah Anda yakin ingin menghapus TNS dengan nomor lacak: <strong className="font-bold text-yellow-400">{itemToDelete.track_number || itemToDelete.id}</strong>?
                <br />
                <span className="text-sm text-gray-400">Tindakan ini tidak dapat dibatalkan.</span>
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="min-h-screen p-4 sm:p-8">
          <div className="max-w-7xl mx-auto pt-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">
              Daftar Service Request
            </h2>

            {/* FILTER CARD */}
            <div className="card p-4 sm:p-6 rounded-xl mb-4 space-y-4">
              <h3 className="text-lg font-semibold text-blue-300 border-b border-blue-900/50 pb-2">
                Filter Data
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {/* Teknisi */}
                <div>
                  <label
                    htmlFor="filter-teknisi"
                    className="block text-sm font-medium mb-1"
                  >
                    Teknisi
                  </label>
                  <select
                    id="filter-teknisi"
                    value={filterTeknisi}
                    onChange={(e) => setFilterTeknisi(e.target.value)}
                    className="input-dark w-full p-2.5 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-150"
                  >
                    <option value="Semua">Semua Teknisi</option>
                    {teknisiOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>



                {/* Cabang */}
                <div>
                  <label
                    htmlFor="filter-cabang"
                    className="block text-sm font-medium mb-1"
                  >
                    Cabang
                  </label>
                  <select
                    id="filter-cabang"
                    value={filterCabang}
                    onChange={(e) => setFilterCabang(e.target.value)}
                    className="input-dark w-full p-2.5 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-150"
                  >
                    <option value="Semua">Semua</option>
                    {cabangOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rows per page */}
                <div>
                  <label
                    htmlFor="rows-per-page"
                    className="block text-sm font-medium mb-1"
                  >
                    Tampilkan
                  </label>
                  <select
                    id="rows-per-page"
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(e.target.value)}
                    className="input-dark w-full p-2.5 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-150"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="Semua">Semua</option>
                  </select>
                </div>

                {/* Search */}
                <div className="col-span-2 md:col-span-1 lg:col-span-3">
                  <label
                    htmlFor="search-input"
                    className="block text-sm font-medium mb-1"
                  >
                    Cari Data (Tracking, Customer, HP)
                  </label>
                  <input
                    id="search-input"
                    type="text"
                    placeholder="Ketik untuk mencari..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="input-dark w-full p-2.5 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-150"
                  />
                </div>
              </div>
            </div>

            {/* DOWNLOAD BUTTON */}
            <div className="flex justify-end mb-4">
              <button
                onClick={handleDownloadCsv}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-800 transition duration-150 shadow-md flex items-center space-x-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Download CSV/Excel</span>
              </button>
            </div>

            {/* TABLE */}
            <div className="card rounded-xl overflow-x-auto">
              <table
                id="service-table"
                className="min-w-full divide-y divide-blue-800/30"
              >
                <thead className="table-header text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-3 text-left">TANGGAL MASUK</th>
                    <th className="px-3 py-3 text-left">TRACKING</th>
                    <th className="px-3 py-3 text-left">STATUS</th>
                    <th className="px-3 py-3 text-left">CUSTOMER</th>
                    <th className="px-3 py-3 text-left">NO HP</th>
                    <th className="px-3 py-3 text-left">TIPE</th>
                    <th className="px-3 py-3 text-left">CABANG</th>
                    <th className="px-3 py-3 text-left">TEKNISI</th>
                    <th className="px-3 py-3 text-left">AKSI</th>
                  </tr>
                </thead>
                <tbody
                  id="table-body"
                  className="divide-y divide-blue-800/30 text-sm"
                >
                  {displayData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="p-4 text-center text-gray-400"
                      >
                        Tidak ada data yang cocok dengan kriteria pencarian
                        Anda.
                      </td>
                    </tr>
                  ) : (
                    displayData.map((item, index) => {
                      const statusLower = (item.status || "").toLowerCase();
                      const statusClass =
                        statusLower === "done"
                          ? "status-done"
                          : "status-pending";
                      const statusText =
                        item.status && item.status.length > 0
                          ? item.status[0].toUpperCase() +
                            item.status.slice(1).toLowerCase()
                          : "-";

                      const tanggal =
                        item.timestamp && typeof item.timestamp === "object"
                          ? new Date(
                              ((item.timestamp as any)._seconds ??
                                (item.timestamp as any).seconds ??
                                0) * 1000
                            ).toLocaleString("id-ID", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "-";

                      return (
                        <tr key={item.id} className="table-body-row">
                          <td className="px-3 py-3 whitespace-nowrap">
                            {tanggal}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <Link
                              href={`/tns/${item.id}`}
                              className="status-link"
                            >
                              {item.track_number || `WO${index + 1}`}
                            </Link>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-lg shadow-black/20 ${statusClass}`}
                            >
                              {statusText}
                            </span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {item.nama || "-"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {item.no_hp || "-"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {item.tipe || "-"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {item.cabang || "-"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {item.assignedTechnician || "-"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <button
                              onClick={() => openConfirmationModal(item.id, item.track_number)}
                              className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-lg text-xs transition-all duration-150 ease-in-out shadow-md hover:shadow-lg"
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </>
    </ProtectedRoute>
  );
}

"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
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
  timestamp?: { seconds: number };
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

  const [teknisiOptions, setTeknisiOptions] = useState<{ email: string; name: string }[]>([]);
  const [cabangOptions, setCabangOptions] = useState<string[]>([]);


  // =======================================
  // FETCH DATA FROM FIRESTORE
  // =======================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const technicianEmailToNameMap = new Map<string, string>();
        const technicianEmails = new Set<string>();

        usersSnapshot.docs.forEach((doc) => {
          const userData = doc.data() as any;
          if (
            userData.role &&
            (userData.role.toLowerCase() === ROLES.STAFF ||
              userData.role.toLowerCase() === ROLES.MANAGER) &&
            userData.email &&
            userData.name
          ) {
            technicianEmailToNameMap.set(userData.email.trim().toLowerCase(), userData.name);
            technicianEmails.add(userData.email.trim().toLowerCase());
          }
        });

        const snap = await getDocs(collection(db, "service_requests"));
        const arr: ServiceRequest[] = snap.docs
          .map((doc) => {
            const dat = doc.data() as any;
            return {
              ...dat,
              id: doc.id,
            };
          })
          .sort((a, b) => getTime(b.timestamp) - getTime(a.timestamp));

        setData(arr);
        setFiltered(arr);

        const serviceRequestTechnicians = new Set<string>();
        const cabangSet = new Set<string>();

        arr.forEach((i) => {
          if (i.assignedTechnician) serviceRequestTechnicians.add(String(i.assignedTechnician).trim().toLowerCase());
          if (i.cabang) cabangSet.add(i.cabang);
        });
        
        const allUniqueTechnicianEmails = new Set<string>();
        technicianEmails.forEach(email => allUniqueTechnicianEmails.add(email));
        serviceRequestTechnicians.forEach(email => allUniqueTechnicianEmails.add(email));

        const uniqueTechnicianOptions: { email: string; name: string }[] = Array.from(allUniqueTechnicianEmails)
          .map(email => ({
            email: email,
            name: technicianEmailToNameMap.get(email) || email.trim().toLowerCase() // Use name if available, otherwise fallback to cleaned email
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setTeknisiOptions(uniqueTechnicianOptions);
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
        (i) =>
          String(i.assignedTechnician || "")
            .trim()
            .toLowerCase() === filterTeknisi.trim().toLowerCase()
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
  }, [filterTeknisi, filterCabang, searchText, data]);

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
            background-color: #f8f9fa;
            color: #212529;
          }
          .card {
            background-color: #ffffff;
            border: 1px solid #dee2e6;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
          }
          .input-dark,
          .select-dark {
            background-color: #ffffff;
            border-color: #ced4da;
            color: #495057;
          }
          .input-dark:focus,
          .select-dark:focus {
            border-color: #007bff;
            box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
          }
          .table-header {
            background-color: #f1f3f5;
            color: #495057;
            border-bottom: 2px solid #007bff;
          }
          .table-body-row {
             border-bottom: 1px solid #e9ecef;
          }
          .table-body-row:nth-child(even) {
            background-color: #f8f9fa;
          }
          .table-body-row:hover {
            background-color: #e9ecef;
            transition: background-color 0.2s;
          }
          .status-done {
            background-color: #d4edda;
            color: #155724;
            font-weight: 700;
          }
          .status-pending {
            background-color: #fff3cd;
            color: #856404;
            font-weight: 700;
          }
          .status-link {
            color: #007bff;
            font-weight: 600;
            text-decoration: none;
          }
          .status-link:hover {
            text-decoration: underline;
          }
        `}</style>

        <NavbarSwitcher />

        <main className="min-h-screen p-4 sm:p-8">
          <div className="max-w-7xl mx-auto pt-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">
              Daftar Service Request
            </h2>

            {/* FILTER CARD */}
            <div className="card p-4 sm:p-6 rounded-xl mb-4 space-y-4">
              <h3 className="text-lg font-semibold text-blue-500 border-b border-blue-900/50 pb-2">
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
                    {teknisiOptions.map((t) => ( // t is now { email, name }
                      <option key={t.email} value={t.email}>
                        {t.name}
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
                  </tr>
                </thead>
                <tbody
                  id="table-body"
                  className="divide-y divide-blue-800/30 text-sm"
                >
                  {displayData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
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

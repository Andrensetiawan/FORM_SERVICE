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
  merk?: string;
  serial_number?: string;
  assignedTechnician?: string | null;
  cabang?: string | null;
};

const getStatusColor = (status: string = "") => {
  const s = status.toLowerCase().replace(/\s/g, '_'); // Normalize status
  switch (s) {
    case "diterima":
    case "diagnosa":
      return "bg-gray-100 text-gray-800";
    case "menunggu_konfirmasi":
    case "testing":
      return "bg-amber-100 text-amber-800";
    case "proses_pengerjaan":
      return "bg-blue-100 text-blue-800";
    case "siap_diambil":
    case "selesai":
      return "bg-green-100 text-green-800";
    case "batal":
      return "bg-red-100 text-red-800";
    // Fallback for old statuses
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "process":
        return "bg-blue-100 text-blue-800";
    case "ready":
        return "bg-teal-100 text-teal-800";
    case "done":
        return "bg-green-100 text-green-800";
    case "cancel":
        return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
};

const getStatusText = (status: string = "") => {
  const s = status.toLowerCase().replace(/\s/g, '_');
  switch (s) {
    case "diterima": return "Diterima";
    case "diagnosa": return "Diagnosa";
    case "menunggu_konfirmasi": return "Menunggu Konfirmasi";
    case "proses_pengerjaan": return "Proses";
    case "testing": return "Testing";
    case "siap_diambil": return "Siap Diambil";
    case "selesai": return "Selesai";
    case "batal": return "Batal";
    // Fallback for old statuses to make them look nice
    case "pending": return "Pending";
    case "process": return "Process";
    case "ready": return "Ready";
    case "done": return "Done";
    case "cancel": return "Cancel";
    default: return status || "-";
  }
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
            return { ...dat, id: doc.id };
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

        const allUniqueTechnicianEmails = new Set([...technicianEmails, ...serviceRequestTechnicians]);
        const uniqueTechnicianOptions: { email: string; name: string }[] = Array.from(allUniqueTechnicianEmails)
          .map(email => ({
            email: email,
            name: technicianEmailToNameMap.get(email) || email.trim().toLowerCase(),
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

  useEffect(() => {
    let result = [...data];
    if (filterTeknisi !== "Semua") {
      result = result.filter(
        (i) => String(i.assignedTechnician || "").trim().toLowerCase() === filterTeknisi.trim().toLowerCase()
      );
    }
    if (filterCabang !== "Semua") {
      result = result.filter((i) => (i.cabang || "").toLowerCase().includes(filterCabang.toLowerCase()));
    }
    if (searchText.trim() !== "") {
      const q = searchText.toLowerCase();
      result = result.filter((i) => {
        const combined = [i.track_number, i.nama, i.no_hp, i.tipe, i.merk, i.serial_number, i.cabang, i.assignedTechnician, i.status]
          .join(" ")
          .toLowerCase();
        return combined.includes(q);
      });
    }
    setFiltered(result);
  }, [filterTeknisi, filterCabang, searchText, data]);

  const handleDownloadCsv = () => {
    const headers = ["Tanggal Masuk", "Tracking", "Status", "Customer", "No HP", "Tipe", "Merk", "Serial Number", "Cabang", "Teknisi"];
    const rows: string[] = [headers.join(",")];
    data.forEach((item) => {
      const tanggal = item.timestamp
        ? new Date((item.timestamp.seconds ?? 0) * 1000).toLocaleString("id-ID", {
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
        item.merk ?? "",
        item.serial_number ?? "",
        item.cabang ?? "",
        item.assignedTechnician ?? "",
      ].map((value) => {
        let v = String(value).replace(/"/g, '""');
        if (v.includes(",")) v = `"${v}"`;
        return v;
      });
      rows.push(cols.join(","));
    });
    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `service_requests_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-800">
        Loading data...
      </div>
    );
  }

  const displayData = rowsPerPage === "Semua" ? filtered : filtered.slice(0, parseInt(rowsPerPage) || filtered.length);

  return (
    <ProtectedRoute
      allowedRoles={[ROLES.STAFF, ROLES.MANAGER, ROLES.OWNER, ROLES.ADMIN]}>
      {/* Minimal style block for custom select arrow that is not easily portable to Tailwind classes without plugins */}
      <style jsx global>{`
        .custom-select-arrow {
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 0.5rem center;
          background-repeat: no-repeat;
          background-size: 1.5em 1.5em;
          padding-right: 2.5rem;
        }
      `}</style>

      <NavbarSwitcher />

      <main className="min-h-screen bg-gray-50 text-slate-800 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto pt-10">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Daftar Service Request</h1>
            <p className="text-sm text-slate-600 mt-1">Kelola dan lacak semua permintaan layanan di sini.</p>
          </header>

          <div className="bg-white border border-slate-200 shadow-sm rounded-xl mb-6">
            <div className="p-4 sm:p-6 border-b border-slate-200">
               <h3 className="text-lg font-semibold text-slate-800">Filter & Kontrol</h3>
            </div>
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Teknisi */}
              <div>
                <label htmlFor="filter-teknisi" className="block text-sm font-medium text-slate-700 mb-1">
                  Teknisi
                </label>
                <select
                  id="filter-teknisi"
                  value={filterTeknisi}
                  onChange={(e) => setFilterTeknisi(e.target.value)}
                  className="custom-select-arrow w-full p-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="Semua">Semua Teknisi</option>
                  {teknisiOptions.map((t) => (
                    <option key={t.email} value={t.email}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Cabang */}
              <div>
                <label htmlFor="filter-cabang" className="block text-sm font-medium text-slate-700 mb-1">
                  Cabang
                </label>
                <select
                  id="filter-cabang"
                  value={filterCabang}
                  onChange={(e) => setFilterCabang(e.target.value)}
                  className="custom-select-arrow w-full p-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="Semua">Semua Cabang</option>
                  {cabangOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Rows per page */}
              <div>
                <label htmlFor="rows-per-page" className="block text-sm font-medium text-slate-700 mb-1">
                  Tampilkan
                </label>
                <select
                  id="rows-per-page"
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(e.target.value)}
                  className="custom-select-arrow w-full p-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="Semua">Semua</option>
                </select>
              </div>
              
              {/* Download Button */}
              <div className="flex items-end">
                 <button
                    onClick={handleDownloadCsv}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300 transition shadow-sm flex items-center justify-center space-x-2"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span>Download CSV</span>
                  </button>
              </div>
              
              {/* Search */}
              <div className="md:col-span-2 lg:col-span-4">
                <label htmlFor="search-input" className="block text-sm font-medium text-slate-700 mb-1">
                  Cari Data (Tracking, Customer, HP, dll.)
                </label>
                <input
                  id="search-input"
                  type="text"
                  placeholder="Ketik untuk mencari..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <table id="service-table" className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Tanggal Masuk</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Tracking</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Customer</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">No HP</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Tipe</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Merk</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Serial Number</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Cabang</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap min-w-[120px]">Teknisi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {displayData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-4 text-center text-slate-500">
                      Tidak ada data yang cocok dengan kriteria pencarian Anda.
                    </td>
                  </tr>
                ) : (
                  displayData.map((item, index) => {
                    const statusClass = getStatusColor(item.status);
                    const statusText = getStatusText(item.status);
                    const tanggal = item.timestamp
                      ? new Date((item.timestamp.seconds ?? 0) * 1000).toLocaleString("id-ID", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "-";

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="hidden md:table-cell px-4 py-3 text-sm text-slate-700">{tanggal}</td>
                        <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">
                           <Link href={`/tns/${item.id}`} className="text-blue-500 hover:text-blue-600 hover:underline">
                            {item.track_number || `WO${index + 1}`}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
                            {statusText}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{item.nama && item.nama.length > 8 ? `${item.nama.substring(0, 8)}...` : (item.nama || "-")}</td>
                        <td className="hidden lg:table-cell px-4 py-3 text-sm text-slate-700">{item.no_hp || "-"}</td>
                        <td className="hidden sm:table-cell px-4 py-3 text-sm text-slate-700 max-w-[150px] whitespace-nowrap overflow-hidden text-ellipsis">{item.tipe || "-"}</td>
                        <td className="hidden xl:table-cell px-4 py-3 text-sm text-slate-700 max-w-[150px] whitespace-nowrap overflow-hidden text-ellipsis">{item.merk || "-"}</td>
                        <td className="hidden xl:table-cell px-4 py-3 text-sm text-slate-700 max-w-[150px] whitespace-nowrap overflow-hidden text-ellipsis">{item.serial_number || "-"}</td>
                        <td className="hidden xl:table-cell px-4 py-3 text-sm text-slate-700 max-w-[150px] whitespace-nowrap overflow-hidden text-ellipsis">{item.cabang || "-"}</td>
                        <td className="hidden lg:table-cell px-4 py-3 text-sm text-slate-700 max-w-[150px] whitespace-nowrap overflow-hidden text-ellipsis">{item.assignedTechnician || "-"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
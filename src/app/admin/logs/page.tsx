"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import NavbarSwitcher from "@/components/navbars/NavbarSwitcher";
import { ROLES } from "@/lib/roles";

import { db } from "@/lib/firebaseConfig";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";

import { Trash2, Search, Filter } from "lucide-react";

export default function LogsViewerPage() {
  const { role, loading } = useAuth();
  const router = useRouter();

  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);

  const [filterRole, setFilterRole] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [searchText, setSearchText] = useState("");

  const [loadingLogs, setLoadingLogs] = useState(true);

  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [logToDeleteId, setLogToDeleteId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // ============================================================
  // ROLE PROTECTION (ADMIN ONLY)
  // ============================================================

  

  // ============================================================
  // FETCH LOGS
  // ============================================================

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const qSnap = await getDocs(
        query(collection(db, "logs"), orderBy("timestamp", "desc"))
      );

      const arr: any[] = [];
      qSnap.forEach((d) => arr.push({ id: d.id, ...d.data() }));

      setLogs(arr);
      setFilteredLogs(arr);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // ============================================================
  // FILTER + SEARCH
  // ============================================================

  useEffect(() => {
    let list = [...logs];

    if (filterRole) list = list.filter((l) => l.role === filterRole);
    if (filterAction) list = list.filter((l) => l.action === filterAction);

    if (searchText.trim()) {
      list = list.filter((l) =>
        JSON.stringify(l).toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredLogs(list);
  }, [filterRole, filterAction, searchText, logs]);


  // ============================================================
  // DELETE LOGS
  // ============================================================

  const executeDeleteLog = async (id: string) => {
    try {
      await deleteDoc(doc(db, "logs", id));
      fetchLogs();
    } catch (error) {
      console.error("Error deleting log:", error);
      // Optionally show a toast notification or error message
    }
  };

  const executeDeleteAllLogs = async () => {
    try {
      const snap = await getDocs(collection(db, "logs"));
      snap.forEach(async (d) => await deleteDoc(doc(db, "logs", d.id)));
      fetchLogs();
    } catch (error) {
      console.error("Error deleting all logs:", error);
      // Optionally show a toast notification or error message
    }
  };

  const handleDeleteClick = (logId?: string) => {
    if (logId) {
      setLogToDeleteId(logId);
      setIsDeletingAll(false);
    } else {
      setLogToDeleteId(null);
      setIsDeletingAll(true);
    }
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteModal(false);
    if (isDeletingAll) {
      executeDeleteAllLogs();
    } else if (logToDeleteId) {
      executeDeleteLog(logToDeleteId);
    }
    setLogToDeleteId(null);
    setIsDeletingAll(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setLogToDeleteId(null);
    setIsDeletingAll(false);
  };

  // ============================================================
  // UI PREMIUM
  // ============================================================

  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER]}>
      <NavbarSwitcher />

      <div className="min-h-screen bg-gray-100 px-6 py-24">
        <div className="max-w-7xl mx-auto">

          {/* HEADER */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 flex items-center gap-3">
                <span className="text-blue-600">🧾</span> Logs Viewer
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Pantau aktivitas sistem secara real-time dalam tampilan premium.
              </p>
            </div>

            <button
              onClick={() => handleDeleteClick()}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-lg shadow-md font-semibold transition flex items-center gap-2"
            >
              <Trash2 size={18} /> Hapus Semua
            </button>
          </div>

          {/* FILTER BAR */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-300 mb-8">
            <div className="flex items-center gap-4 mb-5">
              <Filter size={20} className="text-gray-600" />
              <h2 className="text-lg font-bold text-gray-800">
                Filter Aktivitas
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

              {/* Filter Role */}
              <select
                className="border border-gray-400 p-2 rounded-md bg-white text-gray-800 font-medium"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="">Filter Role</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </select>

              {/* Filter Action */}
              <select
                className="border border-gray-400 p-2 rounded-md bg-white text-gray-800 font-medium"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
              >
                <option value="">Filter Action</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="register">Register</option>
                <option value="create_cabang">Tambah Cabang</option>
                <option value="delete_cabang">Hapus Cabang</option>
                <option value="update_user_role">Ubah Role User</option>
                <option value="delete_user">Hapus User</option>
              </select>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-500" size={18} />
                <input
                  className="border border-gray-400 p-2 pl-10 rounded-md w-full bg-white text-gray-800 font-medium"
                  placeholder="Cari target / detail..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

            </div>
          </div>

          {/* LOGS LIST */}
          <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6">

            {loadingLogs ? (
              <p className="text-center text-gray-700 py-6 font-semibold">
                Memuat log...
              </p>
            ) : filteredLogs.length === 0 ? (
              <p className="text-center text-gray-700 py-6 font-semibold">
                Tidak ada log ditemukan.
              </p>
            ) : (
              <div className="space-y-4">

                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="
                      border border-gray-300 
                      p-4 rounded-lg 
                      flex justify-between items-center 
                      bg-white 
                      hover:bg-gray-50 
                      hover:shadow 
                      transition
                    "
                  >
                    <div>
                      <p className="font-bold text-gray-900 text-lg">
                        {log.action.replaceAll("_", " ")}
                      </p>

                      <p className="text-gray-800 text-sm mt-1 font-medium">
                        Role: <span className="font-bold">{log.role}</span>
                        {log.target && (
                          <> • Target: <span>{log.target}</span></>
                        )}
                      </p>

                      <p className="text-gray-600 text-xs mt-1">
                        {(log.timestamp && (log.timestamp.seconds || log.timestamp._seconds))
                          ? new Date((log.timestamp.seconds || log.timestamp._seconds) * 1000).toLocaleString()
                          : "Waktu tidak tersedia"}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteClick(log.id)}
                      className="text-red-600 hover:bg-red-100 p-2 rounded-lg hover:text-red-800 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}

              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Konfirmasi Penghapusan</h3>
            <p className="text-gray-700 mb-6">
              {isDeletingAll
                ? "Apakah Anda yakin ingin menghapus SEMUA log? Tindakan ini tidak dapat dibatalkan!"
                : "Apakah Anda yakin ingin menghapus log ini? Tindakan ini tidak dapat dibatalkan."}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

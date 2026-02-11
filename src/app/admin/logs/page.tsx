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
import toast from "react-hot-toast";

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
  const [itemToDelete, setItemToDelete] = useState<{ id: string; description: string } | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

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
      toast.error("Gagal memuat log.");
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

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

  const openConfirmationModal = (log?: any) => {
    if (log) {
      // Single log deletion
      setItemToDelete({
        id: log.id,
        description: `log '${log.action}' oleh '${log.role}' pada target '${log.target || "system"}'`,
      });
      setIsDeletingAll(false);
    } else {
      // Bulk delete all
      setItemToDelete(null);
      setIsDeletingAll(true);
    }
    setShowDeleteModal(true);
  };
  
  const handleConfirmDelete = async () => {
    if (isDeletingAll) {
      // Bulk delete
      const promise = getDocs(collection(db, "logs")).then(snap => {
        const deletePromises = snap.docs.map(d => deleteDoc(doc(db, "logs", d.id)));
        return Promise.all(deletePromises);
      });
      
      toast.promise(promise, {
        loading: "Menghapus semua log...",
        success: "Semua log berhasil dihapus.",
        error: "Gagal menghapus semua log."
      });

    } else if (itemToDelete) {
      // Single delete
      const promise = deleteDoc(doc(db, "logs", itemToDelete.id));
      
       toast.promise(promise, {
        loading: `Menghapus ${itemToDelete.description}...`,
        success: "Log berhasil dihapus.",
        error: "Gagal menghapus log."
      });
    }

    setShowDeleteModal(false);
    // Refetch data after operations complete
    setTimeout(fetchLogs, 1500); 
  };
  

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
                Pantau aktivitas sistem secara real-time.
              </p>
            </div>

            <button
              onClick={() => openConfirmationModal()}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-lg shadow-md font-semibold transition flex items-center gap-2"
            >
              <Trash2 size={18} /> Hapus Semua
            </button>
          </div>

          {/* FILTER BAR */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-8">
            <div className="flex items-center gap-4 mb-5">
              <Filter size={20} className="text-gray-600" />
              <h2 className="text-lg font-bold text-gray-800">
                Filter Aktivitas
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

              {/* Filter Role */}
              <select
                className="border border-gray-300 p-2 rounded-lg bg-white text-gray-800 font-medium focus:ring-2 focus:ring-blue-500"
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
                className="border border-gray-300 p-2 rounded-lg bg-white text-gray-800 font-medium focus:ring-2 focus:ring-blue-500"
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
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3 text-gray-500" size={18} />
                <input
                  className="border border-gray-300 p-2 pl-10 rounded-lg w-full bg-white text-gray-800 font-medium focus:ring-2 focus:ring-blue-500"
                  placeholder="Cari target / detail..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

            </div>
          </div>

          {/* LOGS LIST */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">

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
                      border border-gray-200
                      p-4 rounded-lg 
                      flex justify-between items-center 
                      bg-white 
                      hover:bg-gray-50 
                      hover:shadow-sm
                      transition-all
                    "
                  >
                    <div>
                      <p className="font-bold text-gray-900 text-base capitalize">
                        {log.action.replaceAll("_", " ")}
                      </p>

                      <p className="text-gray-700 text-sm mt-1">
                        <span className="font-semibold">Role:</span> {log.role}
                        {log.target && (
                          <> • <span className="font-semibold">Target:</span> {log.target}</>
                        )}
                      </p>

                      <p className="text-gray-500 text-xs mt-2">
                        {(log.timestamp && (log.timestamp.seconds || log.timestamp._seconds))
                          ? new Date((log.timestamp.seconds || log.timestamp._seconds) * 1000).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
                          : "Waktu tidak tersedia"}
                      </p>
                    </div>

                    <button
                      onClick={() => openConfirmationModal(log)}
                      className="text-red-500 hover:bg-red-100 p-2 rounded-lg hover:text-red-700 transition"
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 border">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Konfirmasi Penghapusan</h3>
            <p className="text-gray-600 mb-6">
              {isDeletingAll
                ? <>Apakah Anda yakin ingin menghapus <strong className="font-bold text-red-600">SEMUA</strong> log? Tindakan ini tidak dapat dibatalkan.</>
                : <>Apakah Anda yakin ingin menghapus {itemToDelete?.description || 'log ini'}?</>
              }
              <br/>
              <span className="text-sm text-gray-500 mt-1 block">Tindakan ini tidak dapat dibatalkan.</span>
            </p>
            <div className="flex justify-end gap-3">
               <button
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
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

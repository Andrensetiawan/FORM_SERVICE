"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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

      <div className="min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8 pt-40 pb-12">
        <motion.div 
          className="max-w-7xl mx-auto"
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
        >

          {/* HEADER */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
              <div>
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent mb-2">
                  Logs Viewer
                </h1>
                <p className="text-gray-600 text-lg">Pantau dan kelola aktivitas sistem secara real-time</p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openConfirmationModal()}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl shadow-lg font-bold transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <Trash2 size={20} /> Hapus Semua
              </motion.button>
            </div>
          </div>

          {/* FILTER BAR */}
          <motion.div 
            className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-200">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <Filter size={24} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Filter Aktivitas
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Filter Role */}
              <select
                className="border-2 border-gray-200 p-3 rounded-xl bg-white text-gray-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-300"
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
                className="border-2 border-gray-200 p-3 rounded-xl bg-white text-gray-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-300"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
              >
                <option value="">Filter Action</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="register">Register</option>
                <option value="view_page">View Page</option>
                <option value="create_cabang">Tambah Cabang</option>
                <option value="delete_cabang">Hapus Cabang</option>
                <option value="update_user_role">Ubah Role User</option>
                <option value="delete_user">Hapus User</option>
              </select>

              {/* Search */}
              <div className="relative sm:col-span-2 lg:col-span-2">
                <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input
                  className="border-2 border-gray-200 p-3 pl-12 rounded-xl w-full bg-white text-gray-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-300"
                  placeholder="Cari target / detail..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

            </div>
          </motion.div>

          {/* LOGS LIST */}
          <motion.div 
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >

            {loadingLogs ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-center text-gray-600 mt-4 font-medium">Memuat log...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <Search size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 text-lg font-medium">Tidak ada log ditemukan</p>
              </div>
            ) : (
              <div className="space-y-3">

                {filteredLogs.map((log, index) => {
                  const getActionColor = (action: string) => {
                    if (action.includes('delete') || action === 'logout') return 'from-red-500 to-red-600';
                    if (action.includes('create') || action === 'login') return 'from-green-500 to-green-600';
                    if (action.includes('update') || action.includes('register')) return 'from-blue-500 to-blue-600';
                    return 'from-gray-500 to-gray-600';
                  };
                  
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border border-gray-200 p-4 rounded-xl bg-white hover:bg-gray-50 hover:shadow-md transition-all duration-200 group"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getActionColor(log.action)}`}>
                            {log.action.replaceAll("_", " ")}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                            ${
                              log.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              log.role === 'owner' ? 'bg-indigo-100 text-indigo-800' :
                              log.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }
                          `}>
                            {log.role}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          {log.email && (
                            <p className="text-gray-700">
                              <span className="font-semibold text-gray-800">Email:</span> <span className="font-mono text-blue-600">{log.email}</span>
                            </p>
                          )}
                          
                          {log.target && (
                            <p className="text-gray-700">
                              <span className="font-semibold text-gray-800">Target:</span> <span className="font-mono text-green-600">{log.target}</span>
                            </p>
                          )}

                          {log.detail && (
                            <p className="text-gray-700 sm:col-span-2">
                              <span className="font-semibold text-gray-800">Detail:</span> <span className="text-gray-600">{typeof log.detail === 'string' ? log.detail : JSON.stringify(log.detail)}</span>
                            </p>
                          )}

                          <p className="text-xs text-gray-500">
                            {(log.timestamp && (log.timestamp.seconds || log.timestamp._seconds))
                              ? new Date((log.timestamp.seconds || log.timestamp._seconds) * 1000).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
                              : "Waktu tidak tersedia"}
                          </p>

                          {log.ipAddress && (
                            <p className="text-xs text-gray-500">
                              <span className="font-semibold">IP:</span> {log.ipAddress}
                            </p>
                          )}
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openConfirmationModal(log)}
                        className="text-red-500 hover:bg-red-100 p-2 rounded-lg hover:text-red-700 transition-all flex-shrink-0 mt-2"
                      >
                        <Trash2 size={20} />
                      </motion.button>
                    </motion.div>
                  );
                })}

              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Konfirmasi Penghapusan</h3>
              <div className="h-1 w-12 bg-gradient-to-r from-red-500 to-red-600 rounded-full"></div>
            </div>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              {isDeletingAll
                ? <>Apakah Anda yakin ingin menghapus <strong className="font-bold text-red-600">SEMUA</strong> log? Tindakan ini <strong>tidak dapat dibatalkan</strong>.</>
                : <>Apakah Anda yakin ingin menghapus {itemToDelete?.description || 'log ini'}? Tindakan ini <strong>tidak dapat dibatalkan</strong>.</>
              }
            </p>
            <div className="flex justify-end gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Batal
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleConfirmDelete}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Ya, Hapus
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </ProtectedRoute>
  );
}

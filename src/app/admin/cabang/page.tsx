"use client";

import { useEffect, useState, useCallback } from "react";
import { collection, getDocs, query, where, addDoc, updateDoc, doc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { createLog } from "@/lib/log";
import useAuth from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import NavbarSwitcher from "@/components/navbars/NavbarSwitcher";
import { ROLES } from "@/lib/roles";
import { Plus, Search, Users, Building, X, Save, User as UserIcon, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// -----------------------------
// Types
// -----------------------------
type Manager = {
  uid: string;
  name: string;
  email: string;
};

type Cabang = {
  id: string;
  name: string;
  managerId?: string;
  managerName?: string;
  managerEmail?: string;
  createdAt: Timestamp;
};

// -----------------------------
// Helper
// -----------------------------
const getInitials = (name?: string) => {
  if (!name) return "M";
  const names = name.split(" ");
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// -----------------------------
// Main Component
// -----------------------------
export default function AdminCabangPage() {
  const { user, role } = useAuth();

  const [cabangs, setCabangs] = useState<Cabang[]>([]);
  const [staffCountMap, setStaffCountMap] = useState<Record<string, number>>({});
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [search, setSearch] = useState("");
  
  // State for Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCabangName, setNewCabangName] = useState("");

  // State for editing manager
  const [editingManager, setEditingManager] = useState<Record<string, string | null>>({});

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch Cabangs
      const cabangSnap = await getDocs(collection(db, "cabangs"));
      const cabangsList = cabangSnap.docs.map(d => ({ id: d.id, ...d.data() } as Cabang)).sort((a, b) => a.name.localeCompare(b.name));
      setCabangs(cabangsList);

      // Fetch Managers
      const usersQuery = query(collection(db, "users"), where("approved", "==", true));
      const usersSnap = await getDocs(usersQuery);
      const managersList: Manager[] = [];
      usersSnap.forEach((d) => {
        const raw = d.data();
        if (String(raw.role).toLowerCase() === "manager") {
          const name = raw.displayName ?? raw.name ?? raw.email;
          managersList.push({ uid: d.id, name: name, email: raw.email });
        }
      });
      setManagers(managersList);

      // Fetch staff counts for all cabangs
      const staffCounts: Record<string, number> = {};
      await Promise.all(cabangsList.map(async (cabang) => {
        const staffQuery = query(collection(db, "users"), where("cabang", "==", cabang.name));
        const staffSnap = await getDocs(staffQuery);
        staffCounts[cabang.id] = staffSnap.size;
      }));
      setStaffCountMap(staffCounts);

    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data cabang.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleAddCabang = async () => {
    const name = newCabangName.trim();
    if (!name) return toast.error("Nama cabang tidak boleh kosong");
    if (cabangs.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      return toast.error("Cabang dengan nama tersebut sudah ada");
    }

    setSaving(true);
    try {
      await addDoc(collection(db, "cabangs"), {
        name,
        managerId: "",
        managerName: "",
        managerEmail: "",
        createdAt: new Date(),
      });

      await createLog({ uid: user?.uid ?? "", role: role ?? "unknown", action: "create_cabang", target: name });
      
      setNewCabangName("");
      setIsAddModalOpen(false);
      await fetchAllData();
      toast.success("Cabang berhasil ditambahkan");
    } catch (err) {
      console.error(err);
      toast.error("Gagal menambah cabang");
    }
    setSaving(false);
  };

  const handleSetManager = async (cabangId: string) => {
    const managerId = editingManager[cabangId];
    const cabang = cabangs.find(c => c.id === cabangId);
    if (!managerId || !cabang) return;

    const manager = managers.find(m => m.uid === managerId);
    if (!manager) return toast.error("Manager tidak valid.");
    
    setSaving(true);
    try {
      await updateDoc(doc(db, "cabangs", cabang.id), {
        managerId: manager.uid,
        managerName: manager.name,
        managerEmail: manager.email,
      });

      // Also update the manager's user doc to reflect their new branch
      await updateDoc(doc(db, "users", manager.uid), {
        cabang: cabang.name,
      });

      await createLog({
        uid: user?.uid ?? "",
        role: role ?? "unknown",
        action: "assign_manager",
        detail: `Set manager ${manager.email} for ${cabang.name}`,
      });

      setEditingManager(prev => ({ ...prev, [cabangId]: null }));
      await fetchAllData();
      toast.success("Manager berhasil diperbarui");
    } catch (err) {
      console.error(err);
      toast.error("Gagal memperbarui manager");
    }
    setSaving(false);
  };

  const handleDeleteCabang = async (cabang: Cabang) => {
    if (!confirm(`Hapus cabang ${cabang.name}? Semua staff di dalamnya akan di-unassign.`)) return;
    
    setSaving(true);
    try {
      // Unassign all users from this branch
      const usersQuery = query(collection(db, "users"), where("cabang", "==", cabang.name));
      const usersSnap = await getDocs(usersQuery);
      await Promise.all(usersSnap.docs.map(uDoc => 
        updateDoc(doc(db, "users", uDoc.id), { cabang: "", role: "staff" })
      ));

      // Delete the branch itself
      await deleteDoc(doc(db, "cabangs", cabang.id));
      
      await createLog({ uid: user?.uid ?? "", role: role ?? "unknown", action: "delete_cabang", target: cabang.name });

      toast.success("Cabang berhasil dihapus");
      await fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus cabang.");
    }
    setSaving(false);
  };

  const filteredCabangs = cabangs.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.OWNER]}>
      <div className="min-h-screen bg-gray-100">
        <NavbarSwitcher />

        {/* Add Branch Modal */}
        <AnimatePresence>
          {isAddModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
              onClick={() => setIsAddModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold leading-6 text-gray-900">Tambah Cabang Baru</h3>
                <div className="mt-4">
                  <input
                    type="text"
                    value={newCabangName}
                    onChange={(e) => setNewCabangName(e.target.value)}
                    placeholder="e.g., Kantor Cabang Jakarta"
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200" onClick={() => setIsAddModalOpen(false)}>Batal</button>
                  <button type="button" disabled={saving} onClick={handleAddCabang} className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-gray-400">
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="pt-20 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">Manajemen Cabang</h1>
              <p className="text-gray-600 mt-1">Kelola semua cabang perusahaan Anda.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari cabang..."
                  className="w-full md:w-64 border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 bg-white text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
               <button onClick={() => setIsAddModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white font-semibold shadow-lg transition-all duration-300 bg-indigo-600 hover:bg-indigo-700 transform hover:scale-105">
                <Plus size={18} />
                <span>Tambah Cabang</span>
              </button>
            </div>
          </header>

          {loading ? (
            <div className="text-center py-20 text-gray-500">Memuat data cabang...</div>
          ) : filteredCabangs.length === 0 ? (
            <div className="text-center py-20 text-gray-500 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold">Tidak Ada Cabang</h3>
              <p className="mt-1">Tidak ditemukan cabang dengan nama <span className="font-bold">{search}</span>.</p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence>
                {filteredCabangs.map(cabang => (
                  <motion.div
                    layout
                    key={cabang.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="p-6 flex-grow">
                      <div className="flex justify-between items-start">
                        <Link href={`/admin/cabang/${cabang.id}`} className="block">
                          <h2 className="text-2xl font-bold text-gray-900 hover:text-indigo-600 transition-colors">{cabang.name}</h2>
                        </Link>
                         <div className="flex items-center gap-2 text-gray-600">
                           <Users size={18} />
                           <span className="font-semibold text-lg">{staffCountMap[cabang.id] ?? 0}</span>
                         </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-gray-500 mb-2">Manager</p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold">
                            {getInitials(cabang.managerName)}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">{cabang.managerName || "Belum Ditugaskan"}</p>
                            <p className="text-xs text-gray-500">{cabang.managerEmail || "-"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                         <p className="text-sm font-medium text-gray-500 mb-2">Tugaskan Manager Baru</p>
                         <div className="flex gap-2 items-center">
                            <select
                              value={editingManager[cabang.id] ?? ""}
                              onChange={(e) => setEditingManager(prev => ({...prev, [cabang.id]: e.target.value}))}
                              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 text-sm"
                            >
                              <option value="">Pilih Manager</option>
                              {managers.map(m => <option key={m.uid} value={m.uid}>{m.name}</option>)}
                            </select>
                            {editingManager[cabang.id] && (
                              <button onClick={() => handleSetManager(cabang.id)} disabled={saving} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400">
                                <Save size={18} />
                              </button>
                            )}
                         </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 border-t flex justify-end">
                      <button onClick={() => handleDeleteCabang(cabang)} disabled={saving} className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 font-semibold disabled:text-gray-400">
                        <Trash2 size={14} />
                        <span>Hapus Cabang</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

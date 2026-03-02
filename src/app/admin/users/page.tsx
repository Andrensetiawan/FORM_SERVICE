"use client";

import { useEffect, useState, useCallback } from "react";
import useAuth from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import NavbarSwitcher from "@/components/navbars/NavbarSwitcher";
import { ROLES, UserRole } from "@/lib/roles";
import { Trash2, Save, User as UserIcon, Building, Briefcase, Filter, X, UserCheck, UserX, Clock, AlertCircle } from "lucide-react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { createLog } from "@/lib/log";
import { motion, AnimatePresence } from "framer-motion";

// -----------------------------
// Types
// -----------------------------
type UserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  approved: boolean;
  online: boolean;
  cabang: string;
  division: string;
  createdAt: Date | null;
  lastActive: Date | null;
  photoURL?: string;
};

type ModifiedRecord = Record<
  string,
  {
    role?: UserRole;
    cabang?: string;
    division?: string;
    approved?: boolean;
  }
>;

type ApprovalData = {
  role: UserRole;
  cabang: string;
};

// -----------------------------
// Helper Functions
// -----------------------------
const getInitials = (name: string) => {
  if (!name) return "U";
  const names = name.split(" ");
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const roleColors: Record<UserRole, string> = {
  admin: "bg-red-100 text-red-800 border-red-300",
  owner: "bg-yellow-100 text-yellow-800 border-yellow-300",
  manager: "bg-blue-100 text-blue-800 border-blue-300",
  staff: "bg-green-100 text-green-800 border-green-300",
  pending: "bg-gray-100 text-gray-800 border-gray-300",
  customer: "bg-purple-100 text-purple-800 border-purple-300",
};

// -----------------------------
// Component
// -----------------------------
export default function AdminUsersPage() {
  const { role: currentAdminRole, loading, user: adminUser } = useAuth();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [cabangList, setCabangList] = useState<string[]>([]);
  const [modified, setModified] = useState<ModifiedRecord>({});
  const [saving, setSaving] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, email: string} | null>(null);

  const openConfirmationModal = (id: string, email: string) => {
    setItemToDelete({ id, email });
    setIsModalOpen(true);
  };

  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterCabang, setFilterCabang] = useState<string>("all");
  const [filterDivision, setFilterDivision] = useState<string>("all");

  const divisionOptions = ["IT", "finance", "admin", "sales", "GA", "teknisi"];

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const qUsers = query(collection(db, "users"));
      const snap = await getDocs(qUsers);
      const arr: UserRow[] = [];
      
      snap.docs.forEach(d => {
        const raw = d.data();
        const user: UserRow = {
          id: d.id,
          name: raw.displayName ?? raw.name ?? raw.email ?? "No Name",
          email: raw.email ?? "-",
          role: (raw.role ?? "customer").toLowerCase() as UserRole,
          approved: raw.approved ?? false,
          online: raw.online ?? false,
          cabang: raw.cabang ?? "Unassigned",
          division: raw.division ?? "Unassigned",
          createdAt: raw.createdAt instanceof Timestamp ? raw.createdAt.toDate() : null,
          lastActive: raw.lastActive instanceof Timestamp ? raw.lastActive.toDate() : null,
          photoURL: raw.photoURL,
        };
        arr.push(user);
      });

      setUsers(arr);

    } catch (err) {
      console.error("Fetch users error:", err);
      toast.error("Gagal memuat pengguna.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchCabang = async () => {
    try {
      const snap = await getDocs(collection(db, "cabangs"));
      setCabangList(snap.docs.map(d => String(d.data().name)).filter(Boolean));
    } catch (err) {
      console.error("Fetch cabang error:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCabang();
  }, []);

  const saveChanges = async () => {
    if (Object.keys(modified).length === 0) {
      toast("Tidak ada perubahan untuk disimpan.");
      return;
    }
    setSaving(true);
    try {
      await Promise.all(Object.keys(modified).map(async (uid) => {
        const oldUser = users.find((u) => u.id === uid);
        if (!oldUser) return;

        const changes = modified[uid];
        await updateDoc(doc(db, "users", uid), { ...changes });

        for (const [key, value] of Object.entries(changes)) {
          const oldValue = oldUser[key as keyof UserRow];
          if (value !== oldValue) {
            await createLog({
              uid: adminUser?.uid || "",
              email: adminUser?.email || undefined,
              role: currentAdminRole || "unknown",
              action: `change_${key}`,
              detail: `from ${oldValue} → ${value}`,
              target: oldUser.email || "",
            });
          }
        }
      }));

      toast.success("Perubahan berhasil disimpan.");
      setModified({});
      await fetchUsers();
    } catch (err) {
      console.error("Save changes error:", err);
      toast.error("Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    setActionLoading(itemToDelete.id);
    try {
      await deleteDoc(doc(db, "users", itemToDelete.id));
      
      await createLog({
        uid: adminUser?.uid || "",
        email: adminUser?.email || undefined,
        role: currentAdminRole || "unknown",
        action: "delete_user",
        detail: `Deleted user ${itemToDelete.email}`,
        target: itemToDelete.email || "",
      });

      toast.success("Pengguna berhasil dihapus.");
      await fetchUsers(); // Refetch all users
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Gagal menghapus pengguna.");
    } finally {
      setActionLoading(null);
      setIsModalOpen(false);
      setItemToDelete(null);
    }
  };
  
  const handleModification = (id: string, field: 'role' | 'cabang' | 'division', value: string) => {
    const newChanges: any = { ...(modified[id] || {}), [field]: value };
    
    if (field === 'role' && value === ROLES.PENDING) {
      newChanges.approved = false;
    }

    setModified(prev => ({
      ...prev,
      [id]: newChanges,
    }));
  };

  const filteredUsers = users.filter(u => u.approved).filter((u) => {
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchCabang = filterCabang === "all" || u.cabang === filterCabang;
    const matchDivision = filterDivision === "all" || u.division === filterDivision;
    return matchRole && matchCabang && matchDivision;
  });

  const hasChanges = Object.keys(modified).length > 0;

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-gray-100 text-gray-700">Memuat...</div>;
  }
  
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER]}>
      {isModalOpen && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 border">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Konfirmasi Penghapusan</h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus <strong className="font-bold text-red-600">{itemToDelete.email}</strong>?
              <br />
              <span className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan.</span>
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-gray-100">
        <NavbarSwitcher />
        <main className="pt-20 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">Manajemen Pengguna</h1>
              <p className="text-gray-600 mt-1">Kelola, edit, dan pantau semua pengguna terdaftar.</p>
            </div>
            <AnimatePresence>
              {hasChanges && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <button onClick={saveChanges} disabled={saving} className="mt-4 md:mt-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold shadow-lg transition-all duration-300 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105">
                    <Save size={18} />
                    {saving ? "Menyimpan..." : `Simpan Perubahan (${Object.keys(modified).length})`}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </header>

          <motion.div layout className="bg-white p-4 rounded-xl shadow-md mb-8 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 col-span-1 md:col-span-4">
                <Filter size={20} />
                Filter Pengguna
              </h3>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Role</label>
                <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-full border border-gray-300 px-3 py-2 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all">
                  <option value="all">Semua Role</option>
                  {Object.values(ROLES).filter(r => r !== 'pending' && r !== 'customer').map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Cabang</label>
                <select value={filterCabang} onChange={(e) => setFilterCabang(e.target.value)} className="w-full border border-gray-300 px-3 py-2 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all">
                  <option value="all">Semua Cabang</option>
                  {cabangList.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Divisi</label>
                <select value={filterDivision} onChange={(e) => setFilterDivision(e.target.value)} className="w-full border border-gray-300 px-3 py-2 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all">
                  <option value="all">Semua Divisi</option>
                  {divisionOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
               <button onClick={() => { setFilterRole("all"); setFilterCabang("all"); setFilterDivision("all"); }} className="flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-all shadow-sm">
                  <X size={16}/> Reset Filter
                </button>
            </div>
          </motion.div>

          {loadingUsers ? (
            <div className="text-center py-12 text-gray-600">Memuat pengguna...</div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {filteredUsers.map((u) => (
                  <motion.div
                    layout
                    key={u.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className={`bg-white rounded-2xl shadow-lg border-2 ${modified[u.id] ? 'border-blue-500' : 'border-transparent'} transition-all duration-300 flex flex-col`}
                  >
                    {/* Approved User Card */}
                    <>
                        <div className="p-5 flex-grow">
                          {modified[u.id] && (
                            <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full z-10">
                              Modified
                            </div>
                          )}
                          <div className="flex items-center gap-4 mb-4">
                            <div className="relative">
                              {u.photoURL && u.photoURL.startsWith('http') ? <img src={u.photoURL} alt={u.name} className="w-16 h-16 rounded-full object-cover" /> : <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold">{getInitials(u.name)}</div>}
                              {u.online && <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>}
                            </div>
                            <div className="truncate">
                              <h2 className="font-bold text-lg text-gray-900 truncate" title={u.name}>{u.name}</h2>
                              <p className="text-sm text-gray-600 truncate" title={u.email}>{u.email}</p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2"><UserIcon size={16} className="text-gray-500" /><select defaultValue={u.role} onChange={(e) => handleModification(u.id, 'role', e.target.value)} className={`w-full text-sm font-semibold border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${roleColors[u.role]}`}>{Object.values(ROLES).filter(r => r !== 'customer').map(r => <option key={r} value={r} className="capitalize">{r}</option>)}</select></div>
                            <div className="flex items-center gap-2"><Building size={16} className="text-gray-500" /><select defaultValue={u.cabang} onChange={(e) => handleModification(u.id, 'cabang', e.target.value)} className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"><option value="Unassigned">-</option>{cabangList.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
                            <div className="flex items-center gap-2"><Briefcase size={16} className="text-gray-500" /><select defaultValue={u.division} onChange={(e) => handleModification(u.id, 'division', e.target.value)} className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"><option value="Unassigned">-</option>{divisionOptions.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-b-2xl mt-auto">
                          <div className="text-xs text-gray-500 mb-3"><p>Created: {u.createdAt ? u.createdAt.toLocaleDateString() : "-"}</p><p>Last Active: {u.lastActive ? u.lastActive.toLocaleString() : "Never"}</p></div>
                          <button onClick={() => openConfirmationModal(u.id, u.email)} className="w-full flex items-center justify-center gap-2 text-sm text-red-600 font-semibold hover:bg-red-100 p-2 rounded-lg transition-colors"><Trash2 size={14} />Hapus Pengguna</button>
                        </div>
                      </>
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
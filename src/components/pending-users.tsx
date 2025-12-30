"use client";

import { useEffect, useState, useCallback } from "react";
import useAuth from "@/hooks/useAuth";
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
import { motion, AnimatePresence } from "framer-motion";
import { UserCheck, UserX, Clock, Briefcase, User as UserIcon, AlertCircle } from "lucide-react";
import { ROLES, UserRole } from "@/lib/roles";

// -----------------------------
// Types
// -----------------------------
type PendingUser = {
  id: string;
  email: string;
  createdAt: Date | null;
};

type ApprovalData = {
  role: UserRole;
  cabang: string;
};

// -----------------------------
// Component
// -----------------------------
export default function PendingUsers() {
  const { user, role, loading } = useAuth();

  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [cabangList, setCabangList] = useState<string[]>([]);
  const [approvalData, setApprovalData] = useState<Record<string, ApprovalData>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      // Fetch pending users
      const q = query(collection(db, "users"), where("approved", "==", false));
      const pendingSnaps = await getDocs(q);
      const pendingData = pendingSnaps.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          email: data.email,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null
        }
      });
      setPendingUsers(pendingData);

      // Initialize approval data for each user
      const initialApprovalData: Record<string, ApprovalData> = {};
      pendingData.forEach(u => {
        initialApprovalData[u.id] = { role: ROLES.STAFF, cabang: "" };
      });
      setApprovalData(initialApprovalData);

      // Fetch cabang list for dropdown
      const cabangSnaps = await getDocs(collection(db, "cabangs"));
      setCabangList(cabangSnaps.docs.map(d => d.data().name as string).filter(Boolean));

    } catch (err) {
      console.error("fetchData error:", err);
      toast.error("Gagal mengambil data pengguna.");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && (role === ROLES.ADMIN || role === ROLES.OWNER || role === ROLES.MANAGER)) {
      fetchData();
    }
  }, [role, loading, fetchData]);

  const handleApprovalChange = (id: string, field: 'role' | 'cabang', value: string) => {
    setApprovalData(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const approveUser = async (id: string) => {
    const { role: newRole, cabang } = approvalData[id];
    if (!newRole) return toast.error("Silakan pilih role untuk pengguna.");
    
    setActionLoading(id);
    try {
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, {
        approved: true,
        role: newRole,
        cabang: cabang || "",
      });

      toast.success(`Pengguna disetujui sebagai ${newRole}!`)
      setPendingUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.error("approveUser error:", err);
      toast.error("Gagal menyetujui pengguna.");
    } finally {
      setActionLoading(null);
    }
  };

  const rejectUser = async (id: string) => {
    if (!confirm("Anda yakin ingin menolak dan menghapus pengguna ini?")) return;

    setActionLoading(id);
    try {
      await deleteDoc(doc(db, "users", id));
      toast.success("Pengguna ditolak dan berhasil dihapus.");
      setPendingUsers(prev => prev.filter(u => u.id !== id));
    } catch {
      toast.error("Gagal menolak pengguna.");
    }
    finally {
      setActionLoading(null);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 text-gray-600">
        Memuat data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-20">
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">Pengguna Menunggu Persetujuan</h1>
          <p className="text-gray-600 mt-1">Setujui atau tolak pendaftaran pengguna baru.</p>
        </header>

        {pendingUsers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-md border border-gray-200">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
              <UserCheck size={60} className="mx-auto text-green-500" />
              <h3 className="mt-4 text-xl font-semibold text-gray-800">Semua Sudah Disetujui</h3>
              <p className="mt-1 text-gray-500">Tidak ada pengguna yang menunggu persetujuan saat ini. 🎉</p>
            </motion.div>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {pendingUsers.map(u => (
                <motion.div
                  layout
                  key={u.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  className="bg-white rounded-xl shadow-md border border-gray-200 flex flex-col overflow-hidden"
                >
                  <div className="p-5 flex-grow">
                    <div className="flex items-center gap-3 mb-4">
                       <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                          <AlertCircle className="text-yellow-600" size={28}/>
                       </div>
                       <div className="truncate">
                          <p className="font-semibold text-gray-900 truncate" title={u.email}>{u.email}</p>
                          {u.createdAt && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock size={12} />
                              Mendaftar pada {u.createdAt.toLocaleDateString()}
                            </p>
                          )}
                       </div>
                    </div>
                    
                    <div className="space-y-3">
                       <div>
                         <label className="text-sm font-medium text-gray-600 flex items-center gap-1.5 mb-1"><UserIcon size={14}/> Tetapkan Role</label>
                         <select
                           value={approvalData[u.id]?.role || ROLES.STAFF}
                           onChange={(e) => handleApprovalChange(u.id, 'role', e.target.value)}
                           className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                         >
                           <option value={ROLES.STAFF}>Staff</option>
                           <option value={ROLES.MANAGER}>Manager</option>
                           <option value={ROLES.OWNER}>Owner</option>
                           <option value={ROLES.ADMIN}>Admin</option>
                         </select>
                       </div>
                       <div>
                         <label className="text-sm font-medium text-gray-600 flex items-center gap-1.5 mb-1"><Briefcase size={14}/> Tetapkan Cabang</label>
                         <select
                           value={approvalData[u.id]?.cabang || ""}
                           onChange={(e) => handleApprovalChange(u.id, 'cabang', e.target.value)}
                           className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                         >
                            <option value="">- Tidak Ditugaskan -</option>
                           {cabangList.map(c => <option key={c} value={c}>{c}</option>)}
                         </select>
                       </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 grid grid-cols-2 gap-3">
                     <button
                       onClick={() => rejectUser(u.id)}
                       disabled={actionLoading === u.id}
                       className="flex items-center justify-center gap-2 py-2 px-3 text-sm font-semibold text-red-600 bg-red-100 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50"
                     >
                       <UserX size={16} />
                       {actionLoading === u.id ? "..." : "Tolak"}
                     </button>
                      <button
                       onClick={() => approveUser(u.id)}
                       disabled={actionLoading === u.id}
                       className="flex items-center justify-center gap-2 py-2 px-3 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:bg-gray-400"
                     >
                       <UserCheck size={16} />
                       {actionLoading === u.id ? "..." : "Setujui"}
                     </button>
                  </div>

                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
} from "firebase/firestore";
import toast from "react-hot-toast";

export default function PendingUsersPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Cek role, hanya owner/manager boleh masuk
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (role !== "owner" && role !== "manager") {
        router.push("/unauthorized");
      }
    }
  }, [user, role, loading, router]);

  // Ambil data staff yang belum disetujui
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const q = query(collection(db, "users"), where("approved", "==", false));
        const snaps = await getDocs(q);
        const data = snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPendingUsers(data);
      } catch (err) {
        console.error("fetchPending error:", err);
        toast.error("Gagal mengambil data pending users.");
      } finally {
        setLoadingData(false);
      }
    };

    if (role === "owner" || role === "manager") fetchPending();
  }, [role]);

  // Setujui staff
  const approveUser = async (id: string) => {
    try {
      await updateDoc(doc(db, "users", id), { approved: true });
      toast.success("✅ Staff disetujui!");
      setPendingUsers(pendingUsers.filter((u) => u.id !== id));
    } catch (err) {
      console.error("approveUser error:", err);
      toast.error("Gagal menyetujui staff.");
    }
  };

  // Tolak staff (hapus dokumen user)
  const rejectUser = async (id: string) => {
    try {
      await deleteDoc(doc(db, "users", id));
      toast("🗑️ Staff ditolak dan dihapus.");
      setPendingUsers(pendingUsers.filter((u) => u.id !== id));
    } catch (err) {
      console.error("rejectUser error:", err);
      toast.error("Gagal menolak staff.");
    }
  };

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Loading data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6 md:px-16">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-md border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Pending Approval Staff
        </h1>
        <p className="text-gray-600 mb-6">
          Daftar staff yang menunggu persetujuan owner atau manager.
        </p>

        {pendingUsers.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            Tidak ada staff yang menunggu persetujuan. 🎉
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((u) => (
              <div
                key={u.id}
                className="flex flex-col md:flex-row md:items-center justify-between bg-gray-50 border border-gray-200 p-4 rounded-xl"
              >
                <div>
                  <p className="font-semibold text-gray-800">{u.email}</p>
                  <p className="text-sm text-gray-500">Role: {u.role}</p>
                </div>
                <div className="flex gap-2 mt-3 md:mt-0">
                  <button
                    onClick={() => approveUser(u.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Setujui
                  </button>
                  <button
                    onClick={() => rejectUser(u.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

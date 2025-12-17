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
  setDoc,
  getDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";

export default function PendingUsers() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 🔐 Validasi role: hanya owner / manager / admin
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (
        role !== "owner" &&
        role !== "manager" &&
        role !== "admin"
      ) {
        router.push("/unauthorized");
      }
    }
  }, [user, role, loading, router]);

  // 🔥 Ambil user yang belum approved
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const q = query(collection(db, "users"), where("approved", "==", false));
        const snaps = await getDocs(q);

        const data = snaps.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setPendingUsers(data);
      } catch (err) {
        console.error("fetchPending error:", err);
        toast.error("Gagal mengambil data pending users.");
      } finally {
        setLoadingData(false);
      }
    };

    // owner, manager, admin: semua boleh lihat pending
    if (role === "owner" || role === "manager" || role === "admin") {
      fetchPending();
    }
  }, [role]);

  // 🔔 Setujui pengguna
  const approveUser = async (id: string) => {
    setActionLoading(id);

    try {
      const ref = doc(db, "users", id);

      await new Promise((r) => setTimeout(r, 300)); // jeda animasi

      const snap = await getDoc(ref);

      if (!snap.exists()) {
        // jika doc hilang
        await setDoc(ref, { approved: true, role: "staff" }, { merge: true });
      } else {
        await updateDoc(ref, { approved: true, role: "staff" });
      }

      toast.success("✅ Staff disetujui!");

      // hapus dari daftar pending
      setPendingUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error("approveUser error:", err);
      toast.error("Gagal menyetujui staff. Coba lagi.");
    } finally {
      setActionLoading(null);
    }
  };

  // ❌ Tolak pengguna
  const rejectUser = async (id: string) => {
    setActionLoading(id);

    try {
      await deleteDoc(doc(db, "users", id));
      toast("🗑️ Staff ditolak dan dihapus.");

      // update list
      setPendingUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      toast.error("Gagal menolak staff.");
    } finally {
      setActionLoading(null);
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
    <div className="min-h-screen bg-gray-50 py-23 px-6 md:px-16">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-md border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Pending Approval Staff
        </h1>

        <p className="text-gray-600 mb-6">
          Daftar staff yang menunggu persetujuan owner / manager / admin.
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
                    disabled={actionLoading === u.id}
                    onClick={() => approveUser(u.id)}
                    className={`px-4 py-2 rounded-lg text-white transition ${
                      actionLoading === u.id
                        ? "bg-green-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {actionLoading === u.id ? "Memproses..." : "Setujui"}
                  </button>

                  <button
                    onClick={() => rejectUser(u.id)}
                    disabled={actionLoading === u.id}
                    className={`px-4 py-2 rounded-lg text-white transition ${
                      actionLoading === u.id
                        ? "bg-red-400 cursor-not-allowed"
                        : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    {actionLoading === u.id ? "Menghapus..." : "Tolak"}
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

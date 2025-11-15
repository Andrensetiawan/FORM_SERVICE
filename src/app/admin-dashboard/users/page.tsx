"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import NavbarSwitcher from "@/app/components/navbars/NavbarSwitcher";
import { ROLES } from "@/lib/roles";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
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

export default function AdminUsersPage() {
  const { role, loading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<any[]>([]);
  const [modified, setModified] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // ======================================
  // FETCH USERS — hanya yang approved true
  // ======================================
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const qUsers = query(collection(db, "users"), where("approved", "==", true));
      const snap = await getDocs(qUsers);

      const arr: any[] = [];
      snap.forEach((d) => {
        const raw = d.data() as any;
        arr.push({
          id: d.id,
          name: raw.name || "",
          email: raw.email || "",
          role: (raw.role || "user").toLowerCase(),
          online: raw.online || false,
          cabang: raw.cabang || "-",
          createdAt: raw.createdAt?.toDate?.() || null,
          lastActive: raw.lastActive?.toDate?.() || null,
        });
      });

      setUsers(arr);
    } catch (err) {
      console.error("Fetch users error:", err);
    }
    setLoadingUsers(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ======================================
  // Warna badge
  // ======================================
  const roleColors: any = {
    admin: "bg-blue-200 text-blue-800",
    owner: "bg-purple-200 text-purple-800",
    manager: "bg-green-200 text-green-800",
    staff: "bg-orange-200 text-orange-800",
    user: "bg-gray-200 text-gray-700",
  };

  // ======================================
  // Simpan Perubahan
  // ======================================
  const saveChanges = async () => {
    if (Object.keys(modified).length === 0) {
      toast("Tidak ada perubahan.");
      return;
    }

    setSaving(true);

    try {
      for (const uid of Object.keys(modified)) {
        await updateDoc(doc(db, "users", uid), {
          role: modified[uid].role,
        });
      }

      toast.success("Berhasil menyimpan perubahan.");
      setModified({});
      fetchUsers();
    } catch (err) {
      console.error("Save changes error:", err);
      toast.error("Gagal menyimpan.");
    }

    setSaving(false);
  };

  // ======================================
  // Hapus User
  // ======================================
  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Hapus pengguna ${email}?`)) return;

    try {
      await deleteDoc(doc(db, "users", id));
      toast.success("Pengguna dihapus.");
      fetchUsers();
    } catch (err) {
      toast.error("Gagal menghapus.");
    }
  };

  // ======================================
  // Loading Screen
  // ======================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-700">
        Memuat...
      </div>
    );
  }

  // ======================================
  // PAGE UI
  // ======================================
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
      <div className="min-h-screen bg-gray-50 pt-16">
        <NavbarSwitcher />

        <div className="max-w-7xl mx-auto px-6 py-10">
          <Link href="/admin-dashboard" className="flex items-center text-blue-600 mb-4">
            <ArrowLeft size={20} />
            <span className="ml-2">Kembali</span>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-1">👥 Manajemen Pengguna</h1>
          <p className="text-gray-600 mb-8">
            Menampilkan status online dan badge warna role.
          </p>

          

          {/* SAVE BUTTON */}
          <div className="flex justify-end mb-4">
            <button
              onClick={saveChanges}
              disabled={saving}
              className={`px-5 py-2 rounded-lg text-white font-semibold transition ${
                saving ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>

          {/* TABLE */}
          <div className="bg-white shadow rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 text-gray-700 text-sm font-semibold">
                <tr>
                  <th className="py-3 px-4 text-left">User</th>
                  <th className="py-3 px-4 text-center">Online</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Cabang</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {loadingUsers ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-600 text-sm">
                      Memuat pengguna...
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b text-gray-800 hover:bg-gray-50">

                      {/* USER */}
                      <td className="py-3 px-4">
                        <div className="font-semibold">{u.name || "-"}</div>
                        <div className="text-gray-600 text-sm">{u.email}</div>
                      </td>

                      {/* ONLINE */}
                      <td className="text-center">
                        {u.online ? (
                          <span className="text-green-500 text-lg">●</span>
                        ) : (
                          <span className="text-red-500 text-lg">●</span>
                        )}
                      </td>

                      {/* ROLE SELECT + BADGE */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <select
                            defaultValue={u.role}
                            onChange={(e) =>
                              setModified({
                                ...modified,
                                [u.id]: { role: e.target.value },
                              })
                            }
                            className="border rounded-lg px-3 py-1 bg-white"
                          >
                            <option value="admin">Admin</option>
                            <option value="owner">Owner</option>
                            <option value="manager">Manager</option>
                            <option value="staff">Staff</option>
                            <option value="user">User</option>
                          </select>

                          {/* BADGE */}
                          <span
                            className={`px-3 py-1 text-xs rounded-full font-semibold ${
                              roleColors[u.role]
                            }`}
                          >
                            {u.role.toUpperCase()}
                          </span>
                        </div>
                      </td>

                      {/* CABANG */}
                      <td className="py-3 px-4 text-gray-700">{u.cabang}</td>

                      {/* CREATED */}
                      <td className="py-3 px-4 text-gray-700">
                        {u.createdAt ? u.createdAt.toLocaleString() : "-"}
                      </td>

                      {/* LAST ACTIVE */}
                      <td className="py-3 px-4 text-gray-700">
                        {u.lastActive ? u.lastActive.toLocaleString() : "-"}
                      </td>

                      {/* DELETE */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(u.id, u.email)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-800 mx-auto"
                        >
                          <Trash2 size={16} /> Hapus
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

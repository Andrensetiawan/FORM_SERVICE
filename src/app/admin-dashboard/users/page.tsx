"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import NavbarAdmin from "@/app/components/navbars/NavbarAdmin";
import { ROLES } from "@/lib/roles";
import { ArrowLeft, Plus, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";

export default function AdminUsersPage() {
  const { role, loading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const arr: any[] = [];
      snap.forEach((d) => {
        const raw = d.data() as any;
        arr.push({
          id: d.id,
          name: raw.name || raw.displayName || null,
          email: raw.email || null,
          // normalize role to lowercase to avoid casing mismatches from DB
          role: (raw.role || "user").toString().toLowerCase(),
          approved: typeof raw.approved === "boolean" ? raw.approved : false,
        });
      });
      setUsers(arr.sort((a, b) => (a.name || a.email || "").toString().localeCompare((b.name || b.email || "").toString())));
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const roleBadgeClass = (r: string | undefined) => {
    const roleKey = (r || "user").toString().toLowerCase();
    switch (roleKey) {
      case ROLES.ADMIN:
        return "bg-blue-100 text-blue-800";
      case ROLES.MANAGER:
        return "bg-indigo-100 text-indigo-800";
      case ROLES.OWNER:
        return "bg-purple-100 text-purple-800";
      case ROLES.STAFF:
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  useEffect(() => {
    if (!loading && role !== ROLES.ADMIN) {
      router.push("/unauthorized");
    }
  }, [role, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Memuat...
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16 lg:ml-64">
        <NavbarAdmin />

        <div className="w-full max-w-6xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link href="/admin-dashboard" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
                <ArrowLeft size={20} /> Kembali
              </Link>
              <h1 className="text-3xl font-extrabold text-gray-900">👥 Manajemen Pengguna</h1>
              <p className="text-gray-600 mt-1">Kelola role, persetujuan, dan data staff</p>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition">
              <Plus size={20} /> Tambah Pengguna
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Daftar Pengguna</h2>
              <button onClick={fetchUsers} className="text-sm text-blue-600 hover:underline">Refresh</button>
            </div>

            {loadingUsers ? (
              <div className="py-8 text-center text-gray-500">Memuat pengguna...</div>
            ) : users.length === 0 ? (
              <div className="py-8 text-center text-gray-500">Belum ada pengguna.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-sm text-gray-500 border-b">
                      <th className="py-3">Nama / Email</th>
                      <th className="py-3">Role</th>
                      <th className="py-3">Approved</th>
                      <th className="py-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="text-sm border-b last:border-b-0">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="font-medium text-gray-800">{u.name || u.email}</div>
                            <span className={`text-xs px-2 py-1 rounded ${roleBadgeClass(u.role)}`}>{(u.role || "user").toString().toUpperCase()}</span>
                          </div>
                          <div className="text-gray-500 text-xs">{u.email}</div>
                        </td>
                        <td className="py-3">
                          <select
                            value={(u.role || ROLES.USER).toString().toLowerCase()}
                            onChange={async (e) => {
                              const newRole = e.target.value.toString().toLowerCase();
                              try {
                                await updateDoc(doc(db, "users", u.id), { role: newRole });
                                fetchUsers();
                              } catch (err) {
                                console.error("Failed to update role", err);
                              }
                            }}
                            className="border px-3 py-2 rounded-md text-sm bg-white text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
                          >
                            <option value={ROLES.ADMIN}>Admin</option>
                            <option value={ROLES.MANAGER}>Manager</option>
                            <option value={ROLES.OWNER}>Owner</option>
                            <option value={ROLES.STAFF}>Staff</option>
                            <option value={ROLES.USER}>User</option>
                          </select>
                        </td>
                        <td className="py-3">
                          <button
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, "users", u.id), { approved: !u.approved });
                                fetchUsers();
                              } catch (err) {
                                console.error("Failed to toggle approved", err);
                              }
                            }}
                            className={`px-3 py-1 rounded-full text-sm ${u.approved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                          >
                            {u.approved ? "Approved" : "Pending"}
                          </button>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                if (!confirm(`Hapus pengguna ${u.email}?`)) return;
                                try {
                                  await deleteDoc(doc(db, "users", u.id));
                                  fetchUsers();
                                } catch (err) {
                                  console.error("Failed to delete user", err);
                                }
                              }}
                              className="text-red-600 hover:text-red-800 flex items-center gap-2"
                            >
                              <Trash2 size={16} /> Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

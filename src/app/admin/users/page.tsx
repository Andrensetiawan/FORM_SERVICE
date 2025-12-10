"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import NavbarSwitcher from "@/components/navbars/NavbarSwitcher";
import { ROLES } from "@/lib/roles";
import { Trash2 } from "lucide-react";
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
import { createLog } from "@/lib/log"; // sesuai konfirmasi kamu

// -----------------------------
// Types
// -----------------------------
type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string; // always string (we set default)
  online: boolean;
  cabang: string;
  createdAt: Date | null;
  lastActive: Date | null;
};

type ModifiedRecord = Record<
  string,
  {
    role?: string;
    cabang?: string;
  }
>;

// -----------------------------
// Component
// -----------------------------
export default function AdminUsersPage() {
  const { role, loading, user } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [cabangList, setCabangList] = useState<string[]>([]);
  const [modified, setModified] = useState<ModifiedRecord>({});
  const [saving, setSaving] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterCabang, setFilterCabang] = useState<string>("all");

  // -----------------------------
  // fetch users (approved true)
  // -----------------------------
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const qUsers = query(collection(db, "users"), where("approved", "==", true));
      const snap = await getDocs(qUsers);

      const arr: UserRow[] = [];
      snap.forEach((d) => {
        const raw = d.data() as any;
        arr.push({
          id: d.id,
          name: raw.name ?? "-",
          email: raw.email ?? "-",
          role: (raw.role ?? "user").toLowerCase(),
          online: raw.online ?? false,
          cabang: raw.cabang ?? "-", // ensure string
          createdAt: raw.createdAt instanceof Timestamp ? raw.createdAt.toDate() : null,
          lastActive: raw.lastActive instanceof Timestamp ? raw.lastActive.toDate() : null,
        });
      });

      setUsers(arr);
    } catch (err) {
      console.error("Fetch users error:", err);
      toast.error("Gagal memuat pengguna.");
    } finally {
      setLoadingUsers(false);
    }
  };

  // -----------------------------
  // fetch cabangs collection
  // -----------------------------
  const fetchCabang = async () => {
    try {
      const snap = await getDocs(collection(db, "cabangs")); // sesuai struktur Firestore kamu
      const arr: string[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        if (data.name) arr.push(String(data.name));
      });
      setCabangList(arr);
    } catch (err) {
      console.error("Fetch cabang error:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCabang();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------
  // save changes (role + cabang)
  // -----------------------------
  const saveChanges = async () => {
    if (Object.keys(modified).length === 0) {
      toast("Tidak ada perubahan.");
      return;
    }

    setSaving(true);
    try {
      for (const uid of Object.keys(modified)) {
        const oldUser = users.find((u) => u.id === uid);
        if (!oldUser) continue;

        const changes = modified[uid];

        // use fallback to oldUser values so we always write string
        const newRole = changes.role ?? oldUser.role;
        const newCabang = changes.cabang ?? oldUser.cabang;

        // update firestore (only fields we want)
        await updateDoc(doc(db, "users", uid), {
          role: newRole,
          cabang: newCabang,
        });

        // LOG ROLE
        if (changes.role && changes.role !== oldUser.role) {
          createLog({
            uid: user?.uid || "",
            role: role || "unknown",
            action: "change_role",
            detail: `from ${oldUser.role} → ${changes.role}`,
            target: oldUser.email || "",
          });
        }

        // LOG CABANG
        if (changes.cabang && changes.cabang !== oldUser.cabang) {
          createLog({
            uid: user?.uid || "",
            role: role || "unknown",
            action: "change_branch",
            detail: `from ${oldUser.cabang} → ${changes.cabang}`,
            target: oldUser.email || "",
          });
        }
      }

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

  // -----------------------------
  // delete user
  // -----------------------------
  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Hapus pengguna ${email}?`)) return;

    try {
      await deleteDoc(doc(db, "users", id));

      createLog({
        uid: user?.uid || "",
        role: role || "unknown",
        action: "delete_user",
        detail: `Delete user ${email}`,
        target: email || "",
      });


      toast.success("Pengguna dihapus.");
      fetchUsers();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Gagal menghapus pengguna.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-700">
        Memuat...
      </div>
    );
  }

  // -----------------------------
  // filtered users
  // -----------------------------
  const filteredUsers = users.filter((u) => {
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchCabang = filterCabang === "all" || u.cabang === filterCabang;
    return matchRole && matchCabang;
  });

  // -----------------------------
  // render
  // -----------------------------
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
      <div className="min-h-screen bg-gray-50 pt-16">
        <NavbarSwitcher />

        <div className="max-w-7xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">👥 Manajemen Pengguna</h1>

          {/* FILTER */}
          <div className="flex gap-4 bg-white p-4 rounded-xl shadow mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">Filter Role</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="border border-gray-300 px-3 py-2 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="all">Semua</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
                <option value="user">User</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">Filter Cabang</label>
              <select
                value={filterCabang}
                onChange={(e) => setFilterCabang(e.target.value)}
                className="border border-gray-300 px-3 py-2 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="all">Semua</option>
                {cabangList.map((c, i) => (
                  <option key={i} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
                    <td colSpan={6} className="text-center py-8 text-gray-600 text-sm">
                      Memuat pengguna...
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b text-gray-800 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-semibold">{u.name}</div>
                        <div className="text-xs text-gray-600">{u.email}</div>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          defaultValue={u.role}
                          onChange={(e) =>
                            setModified((prev) => ({
                              ...prev,
                              [u.id]: {
                                ...prev[u.id],
                                role: e.target.value,
                              },
                            }))
                          }
                          className="border rounded-lg px-3 py-1 bg-white"
                        >
                          <option value="admin">Admin</option>
                          <option value="owner">Owner</option>
                          <option value="manager">Manager</option>
                          <option value="staff">Staff</option>
                          <option value="user">User</option>
                        </select>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          defaultValue={u.cabang}
                          onChange={(e) =>
                            setModified((prev) => ({
                              ...prev,
                              [u.id]: {
                                ...prev[u.id],
                                cabang: e.target.value,
                              },
                            }))
                          }
                          className="border rounded-lg px-3 py-1 bg-white"
                        >
                          <option value="-">-</option>
                          {cabangList.map((c, idx) => (
                            <option key={idx} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3 px-4 text-sm text-gray-600">
                        {u.createdAt ? u.createdAt.toLocaleString() : "-"}
                      </td>

                      <td className="py-3 px-4 text-sm text-gray-600">
                        {u.lastActive ? u.lastActive.toLocaleString() : "-"}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(u.id, u.email)}
                          className="text-red-600 hover:text-red-800 flex items-center gap-1 justify-center"
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

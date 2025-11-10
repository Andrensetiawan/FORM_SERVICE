"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { UserCog, Trash2, Save } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import NavbarManagement from "@/app/components/navbars/NavbarManagement";
import Image from "next/image";

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  photoURL?: string;
}

export default function StaffManagementPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [editedRoles, setEditedRoles] = useState<Record<string, string>>({});
  const [actionId, setActionId] = useState<string | null>(null);

  const roleOptions = ["owner", "manager", "staff"];

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (role !== "owner" && role !== "manager") router.push("/unauthorized");
      else fetchStaff();
    }
  }, [user, role, loading, router]);

  const fetchStaff = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const staffData: Staff[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        if (data.role) {
          staffData.push({
            id: docSnap.id,
            name: data.name || "(Tanpa Nama)",
            email: data.email,
            role: data.role,
            photoURL: data.photoURL || "", // 🔹 Tambah foto profil dari Firestore
          });
        }
      });
      setStaffList(staffData);
    } catch (error) {
      console.error("Gagal mengambil data staff:", error);
      toast.error("❌ Gagal memuat data staff");
    }
  };

  const saveRole = async (id: string) => {
    const newRole = editedRoles[id];
    if (!newRole) return;
    setActionId(id);
    try {
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, { role: newRole });
      toast.success(`✅ Role diperbarui menjadi "${newRole}"`);

      setStaffList((prev) =>
        prev.map((s) => (s.id === id ? { ...s, role: newRole } : s))
      );

      setEditedRoles((prev) => {
        const clone = { ...prev };
        delete clone[id];
        return clone;
      });
    } catch (error) {
      console.error(error);
      toast.error("❌ Gagal menyimpan role");
    } finally {
      setActionId(null);
    }
  };

  const deleteStaff = async (id: string, email: string) => {
    if (!confirm(`⚠️ Hapus staff ${email}? Tindakan ini tidak dapat dibatalkan.`))
      return;

    setActionId(id);
    try {
      await deleteDoc(doc(db, "users", id));
      setStaffList((prev) => prev.filter((s) => s.id !== id));

      setEditedRoles((prev) => {
        const clone = { ...prev };
        delete clone[id];
        return clone;
      });

      toast.success("🗑️ Staff berhasil dihapus");
    } catch (error) {
      console.error(error);
      toast.error("❌ Gagal menghapus staff");
    } finally {
      setActionId(null);
    }
  };

  const onSelectChange = (id: string, value: string, currentRole: string) => {
    setEditedRoles((prev) => {
      const next = { ...prev };
      if (value === currentRole) {
        delete next[id];
      } else {
        next[id] = value;
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Memuat data staff...
      </div>
    );
  }

  return (
    <>
      <NavbarManagement />
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
              Daftar Staff
            </h1>
            <p className="text-gray-600">
              Kelola anggota tim: ubah jabatan lalu tekan{" "}
              <b>Simpan</b> untuk menyimpan ke database.
            </p>
          </header>

          {staffList.length === 0 ? (
            <p className="text-center text-gray-500">Belum ada staff terdaftar.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {staffList.map((staff) => {
                const pendingRole = editedRoles[staff.id];
                const effectiveRole = pendingRole ?? staff.role;
                const isDirty =
                  pendingRole !== undefined && pendingRole !== staff.role;
                const isBusy = actionId === staff.id;

                return (
                  <motion.div
                    key={staff.id}
                    whileHover={{ y: -6, scale: 1.02 }}
                    className="bg-white shadow-lg border border-gray-200 rounded-3xl p-6 flex flex-col justify-between hover:shadow-2xl transition"
                  >
                    <div>
                      <div className="flex items-center gap-4 mb-4">
                        {/* 🔹 FOTO PROFIL CLOUDINARY */}
                        <Image
                          src={
                            staff.photoURL ||
                            "https://via.placeholder.com/100?text=No+Photo"
                          }
                          alt={staff.name}
                          width={60}
                          height={60}
                          className="rounded-full border border-blue-300 object-cover"
                          unoptimized
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {staff.name}
                          </h3>
                          <p className="text-sm text-gray-500">{staff.email}</p>
                        </div>
                      </div>

                      <label className="text-sm text-gray-600">Jabatan:</label>
                      <select
                        value={effectiveRole}
                        onChange={(e) =>
                          onSelectChange(staff.id, e.target.value, staff.role)
                        }
                        disabled={isBusy}
                        className="mt-1 w-full border border-gray-300 rounded-xl py-2 px-3 text-gray-800 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                      >
                        {roleOptions.map((r) => (
                          <option key={r} value={r}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-3 mt-6">
                      <button
                        onClick={() => saveRole(staff.id)}
                        disabled={!isDirty || isBusy}
                        className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-medium transition
                          ${
                            isDirty && !isBusy
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-gray-100 text-gray-500 cursor-not-allowed"
                          }`}
                        title={isDirty ? "Simpan perubahan" : "Tidak ada perubahan"}
                      >
                        <Save className="w-5 h-5" />
                        {isBusy ? "Menyimpan..." : "Simpan"}
                      </button>

                      <button
                        onClick={() => deleteStaff(staff.id, staff.email)}
                        disabled={isBusy}
                        className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-xl p-2 transition"
                        title="Hapus staff"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebaseConfig";

import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { UserCog, Trash2, Save } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import NavbarSwitcher from "@/components/navbars/NavbarSwitcher";
import Image from "next/image";
import Link from "next/link";
import { ROLES } from "@/lib/roles";


interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  address?: string;
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
      else if (role !== ROLES.OWNER && role !== ROLES.MANAGER && role !== ROLES.ADMIN) router.push("/unauthorized");
      else fetchStaff();
    }
  }, [user, role, loading, router]);

  const fetchStaff = async () => {
    try {
      // Non-admin/owner viewers should only see users that are approved
      let queryRef;
      if (role === ROLES.OWNER || role === ROLES.ADMIN || role === ROLES.MANAGER) {
        queryRef = collection(db, "users");
      } else {
        queryRef = query(collection(db, "users"), where("approved", "==", true));
      }

      const querySnapshot = await getDocs(queryRef as any);
      const staffData: Staff[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        if (data.role) {
          staffData.push({
            id: docSnap.id,
            name: data.name || "(Tanpa Nama)",
            email: data.email,
            role: data.role,
            photoURL: data.photoURL || "",
            address: data.address || "",
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
      <NavbarSwitcher />
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
              {staffList.map((staff) => (
                <motion.div
                  key={staff.id}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="relative bg-gradient-to-b from-white to-blue-50 border border-blue-100 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all text-center"
                >
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <img
                        src={
                          staff.photoURL ||
                          "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                        }
                        alt="Avatar"
                        className="w-24 h-24 rounded-full border-4 border-blue-400 object-cover shadow-sm"
                      />
                    </div>

                    <h3 className="mt-4 text-lg font-semibold text-gray-800">
                      {staff.name || "Tanpa Nama"}
                    </h3>

                    {/* 🔹 Badge per role */}
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full mt-1 ${
                        staff.role === "owner"
                          ? "bg-yellow-100 text-yellow-700"
                          : staff.role === "manager"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {staff.role}
                    </span>

                    <p className="text-gray-500 text-sm mt-2">{staff.email}</p>

                    <p className="text-xs text-gray-400 mt-2 line-clamp-2 px-2">
                      {staff.address || "Alamat belum diisi"}
                    </p>

                    {/* 🔹 Buttons */}
                    <div className="flex justify-center gap-3 mt-5">
                      <button
                        onClick={() => router.push(`/management/staff/${staff.id}`)}
                        className="px-4 py-2 text-sm font-medium border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition"
                      >
                        Detail
                      </button>

                      <button
                        onClick={() => deleteStaff(staff.id, staff.email)}
                        disabled={actionId === staff.id}
                        className="px-4 py-2 text-sm font-medium bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-400 rounded-lg transition disabled:opacity-50"
                      >
                        {actionId === staff.id ? "Menghapus..." : "Hapus"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

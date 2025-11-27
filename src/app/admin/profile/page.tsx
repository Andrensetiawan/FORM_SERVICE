"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { db, auth } from "@/lib/firebaseConfig";

import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { Toaster, toast } from "react-hot-toast";
import NavbarSwitcher from "@/app/components/navbars/NavbarSwitcher";
import { ROLES } from "@/lib/roles";
import { createLog } from "@/lib/log";

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
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    const allowed = [ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER];

    if (!allowed.includes(role?.toLowerCase())) {
      router.push("/unauthorized");
      return;
    }

    fetchStaff();
  }, [user, role, loading, router]);

  const fetchStaff = async () => {
    try {
      let qRef = collection(db, "users");

      if (role === ROLES.MANAGER) {
        qRef = query(
          qRef,
          where("approved", "==", true),
          where("role", "==", "staff")
        );
      }

      const snap = await getDocs(qRef);
      const arr: Staff[] = [];

      snap.forEach((d) => {
        const data: any = d.data();
        arr.push({
          id: d.id,
          name: data.name || "Tanpa Nama",
          email: data.email,
          role: data.role?.toLowerCase() || "staff",
          photoURL: data.photoURL,
          address: data.address,
        });
      });

      setStaffList(arr);
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengambil data staff");
    }
  };

  const deleteStaff = async (id: string, email: string) => {
    if (!confirm(`Hapus user ${email}?`)) return;

    setActionId(id);

    try {
      const staff = staffList.find((s) => s.id === id);

      if (staff?.role === "admin" || staff?.role === "owner") {
        toast.error("Tidak bisa menghapus Admin/Owner");
        setActionId(null);
        return;
      }

      await deleteDoc(doc(db, "users", id));

      await createLog({
        uid: auth.currentUser?.uid ?? "unknown",
        role: role,
        action: "delete_user",
        target: email,
      });

      setStaffList((prev) => prev.filter((s) => s.id !== id));
      toast.success("Staff berhasil dihapus");
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus staff");
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Memuat data...
      </div>
    );
  }

  return (
    <>
      <NavbarSwitcher />
      <Toaster />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Daftar Staff</h1>
            <p className="text-gray-600">Kelola anggota tim kamu.</p>
          </header>

          {staffList.length === 0 ? (
            <p className="text-center text-gray-500">Tidak ada staff</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {staffList.map((staff) => (
                <motion.div
                  key={staff.id}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="bg-white shadow-md rounded-2xl p-6 border border-gray-100"
                >
                  <div className="text-center">
                    <img
                      src={
                        staff.photoURL ||
                        "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                      }
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                      }}
                      className="w-24 h-24 rounded-full mx-auto border-4 border-blue-300 object-cover"
                    />

                    <h3 className="mt-4 font-semibold text-gray-800">
                      {staff.name}
                    </h3>

                    <p className="text-sm text-gray-500">{staff.email}</p>

                    <span
                      className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        staff.role === "owner"
                          ? "bg-yellow-100 text-yellow-700"
                          : staff.role === "manager"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {staff.role}
                    </span>

                    <div className="flex justify-center gap-3 mt-5">
                      <button
                        onClick={() => router.push(`/admin/users/${staff.id}`)}
                        className="px-4 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition"
                      >
                        Detail
                      </button>

                      <button
                        onClick={() => deleteStaff(staff.id, staff.email)}
                        disabled={actionId === staff.id}
                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-300 rounded-lg hover:bg-red-600 hover:text-white transition"
                      >
                        {actionId === staff.id ? "..." : "Hapus"}
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

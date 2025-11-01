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
import { UserCog, ShieldCheck, Trash2, ArrowDown } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function StaffManagementPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (role !== "owner" && role !== "manager")
        router.push("/unauthorized");
      else fetchStaff();
    }
  }, [user, role, loading]);

  const fetchStaff = async () => {
    const querySnapshot = await getDocs(collection(db, "users"));
    const staffData: Staff[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.role === "staff" || data.role === "manager") {
        staffData.push({
          id: docSnap.id,
          name: data.name || "(Tanpa Nama)",
          email: data.email,
          role: data.role,
        });
      }
    });
    setStaffList(staffData);
  };

  const updateRole = async (id: string, newRole: string) => {
    setActionId(id);
    try {
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, { role: newRole });
      toast.success(
        newRole === "manager"
          ? "✅ Staff berhasil dinaikkan jadi Manager"
          : "👤 Manager diturunkan jadi Staff"
      );
      fetchStaff();
    } catch (error) {
      console.error(error);
      toast.error("❌ Gagal memperbarui role staff");
    } finally {
      setActionId(null);
    }
  };

  const deleteStaff = async (id: string, email: string) => {
    if (
      !confirm(
        `⚠️ Hapus staff ${email}? Tindakan ini tidak dapat dibatalkan.`
      )
    )
      return;

    setActionId(id);
    try {
      await deleteDoc(doc(db, "users", id));
      setStaffList((prev) => prev.filter((s) => s.id !== id));
      toast.success("🗑️ Staff berhasil dihapus");
    } catch (error) {
      console.error(error);
      toast.error("❌ Gagal menghapus staff");
    } finally {
      setActionId(null);
    }
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
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
              Daftar Staff
            </h1>
            <p className="text-gray-600">
              Kelola anggota tim dengan mudah. Ubah role atau hapus akun sesuai
              kebijakan perusahaan.
            </p>
          </header>

          {staffList.length === 0 ? (
            <p className="text-center text-gray-500">
              Belum ada staff terdaftar.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {staffList.map((staff) => (
                <motion.div
                  key={staff.id}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="bg-white shadow-lg border border-gray-200 rounded-3xl p-6 flex flex-col justify-between hover:shadow-2xl transition"
                >
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserCog className="w-7 h-7 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {staff.name}
                        </h3>
                        <p className="text-sm text-gray-500">{staff.email}</p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                      Role:{" "}
                      <span
                        className={`font-semibold ${
                          staff.role === "manager"
                            ? "text-green-600"
                            : "text-gray-800"
                        }`}
                      >
                        {staff.role}
                      </span>
                    </p>
                  </div>

                  <div className="flex gap-3 mt-4">
                    {staff.role === "staff" ? (
                      <button
                        onClick={() => updateRole(staff.id, "manager")}
                        disabled={actionId === staff.id}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-60"
                      >
                        {actionId === staff.id
                          ? "Mengubah..."
                          : "Naikkan jadi Manager"}
                      </button>
                    ) : (
                      <button
                        onClick={() => updateRole(staff.id, "staff")}
                        disabled={actionId === staff.id}
                        className="flex-1 bg-green-50 text-green-700 py-2 rounded-xl font-medium border border-green-200 hover:bg-green-100 transition disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        <ArrowDown className="w-5 h-5" />
                        {actionId === staff.id
                          ? "Mengubah..."
                          : "Turunkan jadi Staff"}
                      </button>
                    )}

                    <button
                      onClick={() => deleteStaff(staff.id, staff.email)}
                      disabled={actionId === staff.id}
                      className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-xl p-2 transition"
                      title="Hapus staff"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
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

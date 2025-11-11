"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import NavbarManagement from "@/app/components/navbars/NavbarManagement";
import toast from "react-hot-toast";

export default function StaffProfilePage() {
  const { id } = useParams();
  const router = useRouter();

  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const roleOptions = ["owner", "manager", "staff"];

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const ref = doc(db, "users", id as string);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setStaff(snap.data());
        } else {
          toast.error("Data staff tidak ditemukan.");
          router.push("/management/staff");
        }
      } catch (error) {
        console.error(error);
        toast.error("Gagal mengambil data staff.");
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [id, router]);

  const handleChange = (field: string, value: string) => {
    setStaff((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const ref = doc(db, "users", id as string);
      await updateDoc(ref, staff);
      toast.success("✅ Profil staff berhasil diperbarui!");
    } catch (error) {
      toast.error("❌ Gagal menyimpan perubahan.");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Memuat data staff...
      </div>
    );
  }

  return (
    <>
      <NavbarManagement />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-14 px-6 md:px-20">
        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-lg p-10 flex flex-col md:flex-row gap-10 items-center md:items-start">
          {/* 🔹 Kiri: Foto Profil */}
          <div className="flex flex-col items-center w-full md:w-1/3">
            <div className="relative">
              <img
                src={
                  staff?.photoURL ||
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                }
                alt="Profile"
                className="w-40 h-40 rounded-full border-4 border-blue-400 object-cover shadow-md"
              />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-gray-800 text-center">
              {staff?.name || "Tanpa Nama"}
            </h2>
            <p
              className={`mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                staff?.role === "owner"
                  ? "bg-yellow-100 text-yellow-700"
                  : staff?.role === "manager"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {staff?.role || "Belum ditentukan"}
            </p>
          </div>

          {/* 🔹 Kanan: Detail Profil */}
          <div className="w-full md:w-2/3 space-y-5">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">
              Profil Staff
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={staff?.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={staff?.email || ""}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* 🔽 Dropdown Jabatan */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Jabatan
                </label>
                <select
                  value={staff?.role || ""}
                  onChange={(e) => handleChange("role", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none text-gray-800 capitalize"
                >

                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Nomor HP
                </label>
                <input
                  type="text"
                  value={staff?.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none text-gray-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Alamat Tempat Tinggal
                </label>
                <textarea
                  value={staff?.address || ""}
                  onChange={(e) => handleChange("address", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none text-gray-800 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-green-600 text-white font-medium rounded-xl shadow hover:bg-green-700 transition disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : "💾 Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import NavbarSwitcher from "@/components/navbars/NavbarSwitcher";
import toast, { Toaster } from "react-hot-toast";
import { Upload, Trash2, ArrowLeft, Mail } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import TeknisiUpdate from "@/components/tns/TeknisiUpdate";
import { createLog } from "@/lib/log";
import { UserRole } from "@/lib/roles";

// Define a type for the user data
type UserData = {
  uid: string;
  name: string;
  email: string;
  role: string;
  division?: string;
  photoURL?: string;
  address?: string;
  teknisi_bertugas?: string;
};

export default function ProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, role: userRole } = useAuth();

  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedTechnicianName, setSelectedTechnicianName] = useState<string>("");

  const roleOptions = ["owner", "manager", "staff"];
  const divisionOptions = ["IT", "finance", "admin", "sales", "GA", "teknisi"];

  const isAdmin = userRole === "admin";
  const currentUid = user?.uid ?? "";

  const setErrorMsg = (msg: string | null) => msg && toast.error(msg);
  const setSuccessMsg = (msg: string | null) => msg && toast.success(msg);

  useEffect(() => {
    if (isAdmin && data && (data.role === "staff" || data.role === "manager")) {
      if (data.division !== "teknisi") {
        handleEdit("division", "teknisi");
      }
    }
  }, [data?.role, isAdmin, data?.division]);

  // ============================= FETCH =============================

  // ============================= FETCH =============================
  useEffect(() => {
    const load = async () => {
      if (!id) {
        console.warn("ID is not available yet for fetching user data.");
        setLoading(false);
        return;
      }
      try {
        const ref = doc(db, "users", id as string);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          console.error(`User with ID ${id} not found.`);
          toast.error("User tidak ditemukan");
          router.push("/");
          return;
        }

        const userData = { uid: snap.id, ...snap.data() } as UserData;
        setData(userData);
        setSelectedTechnicianName(userData.teknisi_bertugas || "");
      } catch (err) {
        toast.error("Gagal memuat data user");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, router]);

  // ============================= UPDATE FORM =============================
  const handleEdit = (field: string, value: string) => {
    setData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSelectTechnician = (technicianName: string) => {
    setSelectedTechnicianName(technicianName);
  };

  // ============================= SAVE =============================
  const handleSave = async () => {
    if (!user) {
      toast.error("Anda harus login untuk menyimpan.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...data,
        teknisi_bertugas: selectedTechnicianName,
      };
      await updateDoc(doc(db, "users", id as string), payload);
      
      await createLog({
        uid: user.uid,
        role: userRole as UserRole,
        action: "update_user_profile",
        target: id as string,
        detail: payload,
      });

      toast.success("Perubahan berhasil disimpan!");
    } catch {
      toast.error("Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  // ============================= CLOUDINARY UPLOAD =============================
  const handleUploadPhoto = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user) {
      toast.error("Anda harus login untuk mengupload foto.");
      return;
    }

    setUploading(true);
    try {
      toast.loading("Mengunggah foto...");
      const token = await user.firebaseUser.getIdToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folderPath", `avatars/${id}`); // Menambahkan folder path untuk avatar

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const d = await res.json();
      toast.dismiss();
      if (!res.ok || !d.secure_url) {
        throw new Error(d.error || "Upload gagal");
      }
      await updateDoc(doc(db, "users", id as string), { photoURL: d.secure_url });

      await createLog({
        uid: user.uid,
        role: userRole as UserRole,
        action: "update_user_photo",
        target: id as string,
        detail: { newPhotoUrl: d.secure_url },
      });

      setData((prev) => (prev ? { ...prev, photoURL: d.secure_url } : null));
      toast.success("Foto berhasil diupdate!");
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  // ============================= DELETE FOTO =============================
  const handleDeletePhoto = async () => {
    if (!user) {
      toast.error("Anda harus login untuk menghapus foto.");
      return;
    }
    if (!confirm("Hapus foto?")) return;

    await updateDoc(doc(db, "users", id as string), { photoURL: "" });

    await createLog({
      uid: user.uid,
      role: userRole as UserRole,
      action: "delete_user_photo",
      target: id as string,
    });

    setData((prev) => (prev ? { ...prev, photoURL: "" } : null));
    toast.success("Foto dihapus");
  };

  // ============================= BADGE WARNA =============================
  const divisionColor: { [key: string]: string } = {
    IT: "bg-blue-100 text-blue-700",
    finance: "bg-green-100 text-green-700",
    admin: "bg-red-100 text-red-600",
    sales: "bg-yellow-100 text-yellow-700",
    GA: "bg-purple-100 text-purple-700",
    teknisi: "bg-gray-200 text-gray-700",
  };

  if (!id) {
    return <div className="h-screen flex justify-center items-center">Memuat ID...</div>;
  }

  if (loading || !data) {
    return <div className="h-screen flex justify-center items-center">Memuat data pengguna...</div>;
  }

  return (
    <>
      <NavbarSwitcher />
      <Toaster />

      <div className="min-h-screen bg-white py-23 px-6 flex justify-center">
        <div className="w-full max-w-5xl">

          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-blue-600 font-medium border border-blue-600 hover:text-blue-700 hover:bg-blue-50 mb-4 px-4 py-2 rounded-lg">
            <ArrowLeft size={20} /> Kembali
          </button>

          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
            Pengaturan Profil
          </h1>

          <div className="bg-white rounded-2xl shadow-lg border p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-8 items-center">

              <img
                src={ data.photoURL ? data.photoURL.replace( "/upload/", "/upload/f_auto,q_auto,w_400,h_400,c_fill/") : "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                alt={data.name}
                className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-md object-cover"
              />

              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-700 uppercase">Nama Pengguna</p>
                <h2 className="text-2xl font-bold text-gray-900">{data.name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-1 text-xs rounded-full font-semibold capitalize bg-blue-100 text-blue-700">
                    {data.role}
                  </span>
                  {data.division && (
                    <span className={`px-3 py-1 text-xs rounded-full font-semibold capitalize ${divisionColor[data.division]}`}>
                      {data.division}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-4 bg-gray-100 px-3 py-2 rounded-lg text-sm w-fit">
                  <Mail size={16} className="text-gray-500" />
                  <span className="text-gray-700 font-medium">{data.email}</span>
                  <span className="text-gray-500 text-xs">(Read-only)</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white cursor-pointer hover:bg-blue-700">
                  <Upload size={18} />
                  {uploading ? "Mengunggah..." : "Ganti Foto"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUploadPhoto} />
                </label>
                {data.photoURL && (
                  <button onClick={handleDeletePhoto} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                    <Trash2 size={18} /> Hapus Foto
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="bg-white border shadow rounded-2xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Detail Personal</h3>
              <div>
                <label className="text-sm font-medium text-gray-800">Nama Lengkap</label>
                <input
                  disabled={!isAdmin && currentUid !== id}
                  value={data.name ?? ""}
                  placeholder="Masukkan nama lengkap"
                  onChange={(e) => handleEdit("name", e.target.value)}
                  className={`w-full mt-1 px-4 py-2 rounded-xl border ${(!isAdmin && currentUid !== id) ? "bg-gray-200 text-gray-600 cursor-not-allowed" : "bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"}`}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-800">Alamat</label>
                <textarea
                  disabled={!isAdmin && currentUid !== id}
                  value={data.address ?? ""}
                  placeholder="Masukkan alamat lengkap"
                  onChange={(e) => handleEdit("address", e.target.value)}
                  rows={3}
                  className={`w-full mt-1 px-4 py-2 rounded-xl border ${(!isAdmin && currentUid !== id) ? "bg-gray-200 text-gray-600 cursor-not-allowed" : "bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"}`}
                />
              </div>
            </div>

            <div className="bg-white border shadow rounded-2xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Posisi Perusahaan</h3>
              <div>
                <label className="text-sm font-medium text-gray-800">Role</label>
                <select
                  disabled={!isAdmin}
                  value={data.role}
                  onChange={(e) => handleEdit("role", e.target.value)}
                  className={`w-full mt-1 px-4 py-2 rounded-xl border capitalize ${(!isAdmin) ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"}`}
                >
                  {roleOptions.map((r) => (<option key={r}>{r}</option>))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-800">Divisi</label>
                <select
                  disabled={!isAdmin}
                  value={data.division || ""}
                  onChange={(e) => handleEdit("division", e.target.value)}
                  className={`w-full mt-1 px-4 py-2 rounded-xl border capitalize ${(!isAdmin) ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"}`}
                >
                  <option value="">-- Pilih Divisi --</option>
                  {divisionOptions.map((d) => (<option key={d}>{d}</option>))}
                </select>
              </div>
              <p className="text-xs text-gray-500">Perubahan role/divisi hanya bisa dilakukan oleh Admin.</p>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <button onClick={handleSave} disabled={saving} className="px-8 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700">
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

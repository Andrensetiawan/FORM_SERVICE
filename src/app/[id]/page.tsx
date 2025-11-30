"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import NavbarSwitcher from "@/app/components/navbars/NavbarSwitcher";
import toast, { Toaster } from "react-hot-toast";
import { Upload, Trash2, ArrowLeft, Mail } from "lucide-react";
import useAuth from "@/hooks/useAuth";

export default function ProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, role: userRole } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const roleOptions = ["owner", "manager", "staff"];
  const divisionOptions = ["IT", "finance", "admin", "sales", "GA", "teknisi"];

  const isAdmin = userRole === "admin";
  const currentUid = user?.uid ?? "";

  // ============================= FETCH =============================
  useEffect(() => {
    const load = async () => {
      try {
        const ref = doc(db, "users", id as string);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          toast.error("User tidak ditemukan");
          router.push("/");
          return;
        }

        setData({ uid: snap.id, ...snap.data() });
      } catch (err) {
        toast.error("Gagal memuat data user");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // ============================= UPDATE FORM =============================
  const handleEdit = (field: string, value: string) => {
    setData((prev: any) => ({ ...prev, [field]: value }));
  };

  // ============================= SAVE =============================
  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", id as string), data);
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

    setUploading(true);
    try {
      toast.loading("Mengunggah foto...");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const d = await res.json();

      toast.dismiss();
      if (!d.secure_url) throw new Error();

      await updateDoc(doc(db, "users", id as string), { photoURL: d.secure_url });
      setData((prev: any) => ({ ...prev, photoURL: d.secure_url }));

      toast.success("Foto berhasil diupdate!");
    } catch {
      toast.error("Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  // ============================= DELETE FOTO =============================
  const handleDeletePhoto = async () => {
    if (!confirm("Hapus foto?")) return;

    await updateDoc(doc(db, "users", id as string), { photoURL: "" });
    setData((prev: any) => ({ ...prev, photoURL: "" }));
    toast.success("Foto dihapus");
  };

  // ============================= BADGE WARNA =============================
  const divisionColor = {
    IT: "bg-blue-100 text-blue-700",
    finance: "bg-green-100 text-green-700",
    admin: "bg-red-100 text-red-600",
    sales: "bg-yellow-100 text-yellow-700",
    GA: "bg-purple-100 text-purple-700",
    teknisi: "bg-gray-200 text-gray-700",
  };

  if (loading || !data) {
    return <div className="h-screen flex justify-center items-center">Memuat…</div>;
  }

  return (
    <>
      <NavbarSwitcher />
      <Toaster />

      <div className="min-h-screen bg-white py-16 px-6 flex justify-center">
        <div className="w-full max-w-5xl">

          {/* BACK */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} /> Kembali ke Beranda
          </button>

          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
            Pengaturan Profil
          </h1>

          {/* ============================= PROFILE CARD ============================= */}
          <div className="bg-white rounded-2xl shadow-lg border p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-8 items-center">

              {/* PHOTO */}
              <img
                src={
                  data.photoURL
                    ? data.photoURL.replace(
                        "/upload/",
                        "/upload/f_auto,q_auto,w_400,h_400,c_fill/"
                      )
                    : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                }
                className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-md object-cover"
              />

              {/* USER INFO */}
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-700 uppercase">Nama Pengguna</p>
                <h2 className="text-2xl font-bold text-gray-900">{data.name}</h2>

                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-1 text-xs rounded-full font-semibold capitalize bg-blue-100 text-blue-700">
                    {data.role}
                  </span>

                  {data.division && (
                    <span
                      className={`px-3 py-1 text-xs rounded-full font-semibold capitalize ${
                        divisionColor[data.division as keyof typeof divisionColor]
                      }`}
                    >
                      {data.division}
                    </span>
                  )}
                </div>

                {/* EMAIL */}
                <div className="flex items-center gap-2 mt-4 bg-gray-100 px-3 py-2 rounded-lg text-sm w-fit">
                  <Mail size={16} className="text-gray-500" />
                  <span className="text-gray-700 font-medium">{data.email}</span>
                  <span className="text-gray-500 text-xs">(Read-only)</span>
                </div>
              </div>

              {/* PHOTO BUTTONS */}
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white cursor-pointer hover:bg-blue-700">
                  <Upload size={18} />
                  {uploading ? "Mengunggah..." : "Ganti Foto"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUploadPhoto} />
                </label>

                {data.photoURL && (
                  <button
                    onClick={handleDeletePhoto}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <Trash2 size={18} /> Hapus Foto
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ============================= FORM ============================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* PERSONAL */}
            <div className="bg-white border shadow rounded-2xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Detail Personal</h3>

              {/* NAME */}
              <div>
                <label className="text-sm font-medium text-gray-800">Nama Lengkap</label>
                <input
                  disabled={!isAdmin && currentUid !== id}
                  value={data.name ?? ""}
                  placeholder="Masukkan nama lengkap"
                  onChange={(e) => handleEdit("name", e.target.value)}
                  className={`w-full mt-1 px-4 py-2 rounded-xl border 
                    ${(!isAdmin && currentUid !== id)
                      ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                      : "bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    }`}
                />

              </div>

              {/* ADDRESS */}
              <div>
                <label className="text-sm font-medium text-gray-800">Alamat</label>
                <textarea
                  disabled={!isAdmin && currentUid !== id}
                  value={data.address ?? ""}
                  placeholder="Masukkan alamat lengkap"
                  onChange={(e) => handleEdit("address", e.target.value)}
                  rows={3}
                  className={`w-full mt-1 px-4 py-2 rounded-xl border 
                    ${(!isAdmin && currentUid !== id)
                      ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                      : "bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    }`}
                />
              </div>
            </div>

            {/* ROLE / DIVISION */}
            <div className="bg-white border shadow rounded-2xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Posisi Perusahaan</h3>

              {/* ROLE */}
              <div>
                <label className="text-sm font-medium text-gray-800">Role</label>
                <select
                  disabled={!isAdmin}
                  value={data.role}
                  onChange={(e) => handleEdit("role", e.target.value)}
                  className={`w-full mt-1 px-4 py-2 rounded-xl border capitalize
                    ${(!isAdmin)
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    }`}
                                  >
                  {roleOptions.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* DIVISION */}
              <div>
                <label className="text-sm font-medium text-gray-800">Divisi</label>
                <select
                  disabled={!isAdmin}
                  value={data.division || ""}
                  onChange={(e) => handleEdit("division", e.target.value)}
                  className={`w-full mt-1 px-4 py-2 rounded-xl border capitalize
                    ${(!isAdmin)
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    }`}
                                    >
                  <option value="">-- Pilih Divisi --</option>
                  {divisionOptions.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-gray-500">
                Perubahan role/divisi hanya bisa dilakukan oleh Admin.
              </p>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div className="flex justify-end mt-8">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700"
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

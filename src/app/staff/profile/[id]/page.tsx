"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import NavbarManagement from "@/app/components/navbars/NavbarStaff";
import toast from "react-hot-toast";
import { Upload, Trash2 } from "lucide-react";

export default function StaffProfilePage() {
  const { id } = useParams();
  const router = useRouter();

  const [staff, setStaff] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const roleOptions = ["owner", "manager", "staff"];
  const divisionOptions = ["teknisi", "sales", "admin", "GA", "finance", "IT"];

  // 🔹 Ambil data staff & current user
  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) setCurrentUser(userSnap.data());
        }

        const ref = doc(db, "users", id as string);
        const snap = await getDoc(ref);
        if (snap.exists()) setStaff(snap.data());
        else {
          toast.error("Data staff tidak ditemukan.");
          router.push("/management/staff");
        }
      } catch (err) {
        console.error(err);
        toast.error("Gagal memuat data staff.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, router]);

  const handleChange = (field: string, value: string) =>
    setStaff((prev: any) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", id as string), staff);
      toast.success("✅ Profil staff berhasil diperbarui!");
    } catch (error) {
      toast.error("❌ Gagal menyimpan perubahan.");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // 🧩 Kompres gambar besar
  const compressImage = async (file: File, maxSize = 800): Promise<File> =>
    new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => blob && resolve(new File([blob], file.name, { type: file.type })),
          "image/jpeg",
          0.8
        );
      };
    });

  // 📤 Upload foto ke Cloudinary
  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      let uploadFile = file;
      if (file.size > 10 * 1024 * 1024) {
        toast.loading("📸 Mengompres gambar besar (>10MB)...");
        uploadFile = await compressImage(file);
        toast.dismiss();
      }

      toast.loading("☁️ Mengunggah ke Cloudinary...");
      const formData = new FormData();
      formData.append("file", uploadFile);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      toast.dismiss();

      if (!res.ok || !data.secure_url)
        throw new Error(data.error || "Upload gagal.");

      await updateDoc(doc(db, "users", id as string), {
        photoURL: data.secure_url,
      });
      setStaff((prev: any) => ({ ...prev, photoURL: data.secure_url }));
      toast.success("✅ Foto profil berhasil diperbarui!");
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error("❌ Gagal mengunggah foto.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // 🗑️ Hapus foto profil
  const handleDeletePhoto = async () => {
    if (!confirm("Yakin ingin menghapus foto profil?")) return;
    try {
      await updateDoc(doc(db, "users", id as string), { photoURL: "" });
      setStaff((prev: any) => ({ ...prev, photoURL: "" }));
      toast.success("🗑️ Foto profil dihapus!");
    } catch (error) {
      toast.error("❌ Gagal menghapus foto.");
      console.error(error);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Memuat data staff...
      </div>
    );

  // 🔒 Role & Divisi hanya bisa diubah oleh owner/manager/admin
  const canEditSensitive = ["owner", "manager", "admin"].includes(currentUser?.role);

  return (
    <>
      <NavbarManagement />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-14 px-6 md:px-20">
        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-lg p-10 flex flex-col md:flex-row gap-10 items-center md:items-start">
          {/* 🔹 Foto Profil */}
          <div className="flex flex-col items-center w-full md:w-1/3">
            <img
              src={
                staff?.photoURL
                  ? staff.photoURL.replace(
                      "/upload/",
                      "/upload/f_auto,q_auto,w_400,h_400,c_fill/"
                    )
                  : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }
              alt="Profile"
              className="w-40 h-40 rounded-full border-4 border-blue-400 object-cover shadow-md"
            />

            <div className="flex flex-col items-center gap-3 mt-5">
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium cursor-pointer transition">
                <Upload size={18} />
                {uploading ? "Mengunggah..." : "Ganti Foto"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadPhoto}
                  disabled={uploading}
                />
              </label>

              {staff?.photoURL && (
                <button
                  onClick={handleDeletePhoto}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-400 text-red-600 hover:bg-red-50 font-medium text-sm transition"
                >
                  <Trash2 size={18} />
                  Hapus Foto
                </button>
              )}
            </div>

            <h2 className="mt-6 text-2xl font-bold text-gray-800 text-center">
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

          {/* 🔹 Detail Profil */}
          <div className="w-full md:w-2/3 space-y-5">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">
              Profil Staff
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Nama */}
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

              {/* Email */}
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

              {/* Jabatan */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Jabatan
                </label>
                {canEditSensitive ? (
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
                ) : (
                  <input
                    type="text"
                    value={staff?.role || "-"}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed capitalize"
                  />
                )}
              </div>

              {/* Divisi */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Divisi / Bidang Kerja
                </label>
                {canEditSensitive ? (
                  <select
                    value={staff?.division || ""}
                    onChange={(e) => handleChange("division", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none text-gray-800 capitalize"
                  >
                    <option value="">-- Pilih Divisi --</option>
                    {divisionOptions.map((d) => (
                      <option key={d} value={d}>
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={staff?.division || "-"}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed capitalize"
                  />
                )}
              </div>

              {/* Nomor HP */}
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

              {/* Alamat */}
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

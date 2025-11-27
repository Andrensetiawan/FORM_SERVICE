"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import NavbarSwitcher from "@/app/components/navbars/NavbarSwitcher";
import toast from "react-hot-toast";
import { Upload, Trash2 } from "lucide-react";
import useAuth from "@/hooks/useAuth"; // ⭐ Tambahan penting

export default function StaffProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { role: userRole } = useAuth(); // ⭐ Ambil role user yang login

  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const roleOptions = ["owner", "manager", "staff"];
  const divisionOptions = ["teknisi", "sales", "admin", "GA", "finance", "IT"];

  // Ambil data user
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

  // Limit pixel & compress
  const MAX_PIXELS = 50_000_000;
  const COMPRESS_THRESHOLD = 20 * 1024 * 1024;

  const compressImage = async (file: File, maxSize = 2000): Promise<File> =>
    new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        const totalPixels = img.width * img.height;

        let width = img.width;
        let height = img.height;

        if (totalPixels > MAX_PIXELS) {
          const scale = Math.sqrt(MAX_PIXELS / totalPixels);
          width = width * scale;
          height = height * scale;
        }

        const scale = Math.min(maxSize / width, maxSize / height, 1);
        width = width * scale;
        height = height * scale;

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(new File([blob!], file.name, { type: "image/jpeg" }));
          },
          "image/jpeg",
          0.8
        );
      };
    });

  // Upload foto Cloudinary
  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      let uploadFile = file;

      if (file.size > COMPRESS_THRESHOLD) {
        toast.loading("📦 Mengompres gambar > 20MB...");
        uploadFile = await compressImage(file);
        toast.dismiss();
      }

      toast.loading("☁️ Mengunggah foto...");
      const formData = new FormData();
      formData.append("file", uploadFile);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      toast.dismiss();

      if (!res.ok || !data.secure_url) {
        throw new Error(data.error || "Upload gagal");
      }

      const downloadURL = data.secure_url;
      await updateDoc(doc(db, "users", id as string), { photoURL: downloadURL });

      setStaff((prev: any) => ({ ...prev, photoURL: downloadURL }));
      toast.success("✅ Foto profil berhasil diperbarui!");
    } catch (error) {
      console.error(error);
      toast.dismiss();
      toast.error("❌ Gagal mengunggah foto.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm("Apakah kamu yakin ingin menghapus foto profil ini?")) return;

    try {
      await updateDoc(doc(db, "users", id as string), { photoURL: "" });
      setStaff((prev: any) => ({ ...prev, photoURL: "" }));
      toast.success("🗑️ Foto profil dihapus!");
    } catch (error) {
      console.error(error);
      toast.error("❌ Gagal menghapus foto.");
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
      <NavbarSwitcher />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-14 px-6 md:px-20">
        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-lg p-10 flex flex-col md:flex-row gap-10 items-center md:items-start">

          {/* FOTO PROFIL */}
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
              className="w-40 h-40 rounded-full border-4 border-blue-400 object-cover shadow-md"
              alt="avatar"
            />

            <label className="flex items-center gap-2 px-4 py-2 mt-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium cursor-pointer">
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
                className="flex items-center gap-2 px-4 py-2 mt-2 rounded-lg border border-red-400 text-red-600 hover:bg-red-50"
              >
                <Trash2 size={18} />
                Hapus Foto
              </button>
            )}

            <h2 className="mt-6 text-2xl font-bold">{staff?.name}</h2>

            <p
              className={`mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                staff?.role === "owner"
                  ? "bg-yellow-100 text-yellow-700"
                  : staff?.role === "manager"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {staff?.role}
            </p>
          </div>

          {/* FORM DETAIL STAFF */}
          <div className="w-full md:w-2/3 space-y-5">
            <h3 className="text-xl font-semibold border-b pb-2">Profil Staff</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* NAMA */}
              <div>
                <label className="text-sm font-medium">Nama Lengkap</label>
                <input
                  type="text"
                  value={staff?.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full px-4 py-2 mt-1 border rounded-xl"
                />
              </div>

              {/* EMAIL */}
              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={staff?.email || ""}
                  readOnly
                  className="w-full px-4 py-2 mt-1 border rounded-xl bg-gray-100"
                />
              </div>

              {/* JABATAN — LOCK JIKA LOGIN = STAFF */}
              <div>
                <label className="text-sm font-medium">Jabatan</label>
                <select
                  value={staff?.role || ""}
                  onChange={(e) => handleChange("role", e.target.value)}
                  disabled={userRole === "staff"} // 🔒 lock
                  className={`w-full px-4 py-2 mt-1 border rounded-xl capitalize ${
                    userRole === "staff" ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* DIVISI */}
              <div>
                <label className="text-sm font-medium">Divisi</label>
                <select
                  value={staff?.division || ""}
                  onChange={(e) => handleChange("division", e.target.value)}
                  disabled={userRole === "staff"} // 🔒 lock
                  className={`w-full px-4 py-2 mt-1 border rounded-xl capitalize ${
                    userRole === "staff" ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                >
                  <option value="">-- Pilih Divisi --</option>
                  {divisionOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* NOMOR HP */}
              <div>
                <label className="text-sm font-medium">Nomor HP</label>
                <input
                  type="text"
                  value={staff?.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full px-4 py-2 mt-1 border rounded-xl"
                />
              </div>

              {/* ALAMAT */}
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Alamat</label>
                <textarea
                  rows={3}
                  value={staff?.address || ""}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="w-full px-4 py-2 mt-1 border rounded-xl"
                ></textarea>
              </div>
            </div>

            {/* SIMPAN */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-green-600 text-white rounded-xl"
              >
                {saving ? "Menyimpan..." : "💾 Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      </div>c
    </>
  );
}

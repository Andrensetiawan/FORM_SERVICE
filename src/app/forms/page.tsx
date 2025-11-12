"use client";

import InputField from "@/app/components/inputfield";
import FormSection from "@/app/components/formsection";
import Navbar from "@/app/components/navbars/NavbarStaff";
import { useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { generateTrackNumber } from "@/lib/trackNumber";
import ProtectedRoute from "@/app/components/ProtectedRoute";



export default function Home() {
  const [formData, setFormData] = useState({
    nama: "",
    alamat: "",
    no_hp: "",
    email: "",
    merk: "",
    tipe: "",
    serial_number: "",
    keluhan: "",
    spesifikasi_teknis: "",
    jenis_perangkat: [] as string[],
    keterangan_perangkat: "",
    accessories: [] as string[],
    keterangan_accessories: "",
    garansi: false,
    keterangan_garansi: "",
    kondisi: [] as string[],
    keterangan_kondisi: "",
    prioritas_service: "1. Reguler",
    track_number: "",
    penerima_service: "",
    cabang: "",
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleJenisPerangkat = (device: string) => {
    setFormData(prev => {
      const jenis_perangkat = prev.jenis_perangkat.includes(device)
        ? prev.jenis_perangkat.filter(x => x !== device)
        : [...prev.jenis_perangkat, device];
      return { ...prev, jenis_perangkat };
    });
  };

  const handleKondisi = (condition: string) => {
    setFormData(prev => {
      const kondisi = prev.kondisi.includes(condition)
        ? prev.kondisi.filter(x => x !== condition)
        : [...prev.kondisi, condition];
      return { ...prev, kondisi };
    });
  };

  const handleGaransi = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, garansi: e.target.value === "Ya" }));
  };

  const handleAccessories = (item: string) => {
    setFormData(prev => {
      const accessories = prev.accessories.includes(item)
        ? prev.accessories.filter(x => x !== item)
        : [...prev.accessories, item];
      return { ...prev, accessories };
    });
  };

  // Validasi semua field sebelum submit
  const validateForm = () => {
    const newErrors: string[] = [];

    if (!formData.nama.trim()) newErrors.push("Nama wajib diisi.");
    if (!formData.alamat.trim()) newErrors.push("Alamat wajib diisi.");
    if (!formData.no_hp.trim()) newErrors.push("No HP wajib diisi.");
    if (!formData.email.trim()) newErrors.push("Email wajib diisi.");
    if (!formData.merk.trim()) newErrors.push("Merk wajib diisi.");
    if (!formData.tipe.trim()) newErrors.push("Tipe wajib diisi.");
    if (!formData.serial_number.trim()) newErrors.push("Serial Number wajib diisi.");
    if (!formData.keluhan.trim()) newErrors.push("Keluhan wajib diisi.");
    if (!formData.spesifikasi_teknis.trim()) newErrors.push("Spesifikasi Teknis wajib diisi.");
    if (formData.jenis_perangkat.length === 0) newErrors.push("Pilih minimal 1 jenis perangkat.");    if (formData.accessories.length === 0) newErrors.push("Pilih minimal 1 accessories.");
    if (formData.kondisi.length === 0) newErrors.push("Pilih minimal 1 kondisi perangkat.");
    if (!formData.prioritas_service.trim()) newErrors.push("Prioritas Service wajib diisi.");
    if (!formData.penerima_service.trim()) newErrors.push("Penerima Service wajib diisi.");

    setErrors(newErrors);
    return newErrors.length === 0;
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateForm()) return;

  try {
    const newTrackNumber = await generateTrackNumber(formData.cabang);
    setFormData(prev => ({ ...prev, track_number: newTrackNumber }));

    await addDoc(collection(db, "service_requests"), {
      ...formData,
      track_number: newTrackNumber,
      status: "pending",
      timestamp: serverTimestamp(),
    });

    setSuccessMessage(`✅ Data berhasil disimpan! Track Number: ${newTrackNumber}`);
    setErrors([]);

    // reset form
    setFormData({
      nama: "",
      alamat: "",
      no_hp: "",
      email: "",
      merk: "",
      tipe: "",
      serial_number: "",
      keluhan: "",
      spesifikasi_teknis: "",
      jenis_perangkat: [],
      keterangan_perangkat: "",
      accessories: [],
      keterangan_accessories: "",
      garansi: false,
      keterangan_garansi: "",
      kondisi: [],
      keterangan_kondisi: "",
      prioritas_service: "1. Reguler",
      track_number: "",
      penerima_service: "",
      cabang: ""
      
    });
  } catch (error) {
    console.error("❌ Gagal menyimpan data:", error);
    setErrors(["Gagal menyimpan data ke Firestore."]);
  }
};


  return (
    <ProtectedRoute>
    <div className="bg-white min-h-screen">
      <Navbar />

      <main className="max-w-4xl w-full mx-auto p-6 space-y-6">
        <div className="text-center text-black">
          <h1 className="text-2xl font-bold">Selamat datang di Layanan Service Kami</h1>
          <p>Cepat, Mudah, dan Terpercaya!</p>
        </div>


        <form className="space-y-6 text-black" onSubmit={handleSubmit}>
          {/* Form Sections tetap sama */}
          {/* Data Customer */}
          <FormSection title="Data Customer">
            <InputField label="Nama" placeholder="Nama" name="nama" value={formData.nama} onChange={handleInputChange} />
            <InputField label="Alamat" placeholder="Alamat" textarea name="alamat" value={formData.alamat} onChange={handleInputChange} />
            <InputField label="No. Handphone" placeholder="No. Handphone" name="no_hp" value={formData.no_hp} onChange={handleInputChange} />
            <InputField label="Email" placeholder="Email" name="email" value={formData.email} onChange={handleInputChange} />
          </FormSection>

          {/* Data Perangkat */}
          <FormSection title="Data Perangkat">
            <InputField label="Merk" placeholder="Merk" name="merk" value={formData.merk} onChange={handleInputChange} />
            <InputField label="Tipe" placeholder="Tipe" name="tipe" value={formData.tipe} onChange={handleInputChange} />
            <InputField label="Serial Number" placeholder="Serial Number" name="serial_number" value={formData.serial_number} onChange={handleInputChange} />
            <InputField label="Keluhan" placeholder="Keluhan" textarea name="keluhan" value={formData.keluhan} onChange={handleInputChange} />
            <InputField label="Spesifikasi Teknis" placeholder="Spesifikasi Teknis" textarea name="spesifikasi_teknis" value={formData.spesifikasi_teknis} onChange={handleInputChange} />
          </FormSection>

          {/* Jenis Perangkat */}
          <FormSection title="Jenis Perangkat">
            <div className="flex flex-wrap gap-4">
              {["Laptop", "PC", "UPS", "Console"].map((device) => (
                <label key={device} className="flex items-center space-x-2">
                  <input type="checkbox" className="w-4 h-4" checked={formData.jenis_perangkat.includes(device)} onChange={() => handleJenisPerangkat(device)} />
                  <span>{device}</span>
                </label>
              ))}
            </div>
            <InputField label="Keterangan" placeholder="Keterangan" name="keterangan_perangkat" value={formData.keterangan_perangkat} onChange={handleInputChange} />
          </FormSection>

          {/* Accessories */}
          <FormSection title="Accessories">
            <div className="flex flex-wrap gap-4">
              {["Baterai", "Adaptor", "Tas", "Casing", "Mouse", "Receiver"].map((acc) => (
                <label key={acc} className="flex items-center space-x-2">
                  <input type="checkbox" checked={formData.accessories.includes(acc)} onChange={() => handleAccessories(acc)} className="w-4 h-4" />
                  <span>{acc}</span>
                </label>
              ))}
            </div>
            <InputField label="Keterangan" placeholder="Keterangan" name="keterangan_accessories" value={formData.keterangan_accessories} onChange={handleInputChange} />
          </FormSection>

          {/* Garansi */}
          <FormSection title="Garansi">
            <div className="flex space-x-6">
              <label className="flex items-center space-x-2">
                <input type="radio" name="garansi" value="Ya" checked={formData.garansi} onChange={handleGaransi} className="w-4 h-4" />
                <span>Ya</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" name="garansi" value="Tidak" checked={!formData.garansi} onChange={handleGaransi} className="w-4 h-4" />
                <span>Tidak</span>
              </label>
            </div>
            <InputField label="Keterangan Garansi" placeholder="Keterangan" name="keterangan_garansi" value={formData.keterangan_garansi} onChange={handleInputChange} />
          </FormSection>

          {/* Kondisi */}
          <FormSection title="Kondisi Saat Masuk">
            <div className="grid grid-cols-2 gap-3">
              {[
                "Mati Total", "Layar Gelap", "Layar Biru", "Bekas Jatuh",
                "Chasing Pecah", "Pernah Dibongkar", "Baret", "Retak",
                "Kotor / Berdebu",
              ].map((condition) => (
                <label key={condition} className="flex items-center space-x-2">
                  <input type="checkbox" className="w-4 h-4" checked={formData.kondisi.includes(condition)} onChange={() => handleKondisi(condition)} />
                  <span>{condition}</span>
                </label>
              ))}
            </div>
            <InputField label="Keterangan" placeholder="Keterangan" name="keterangan_kondisi" value={formData.keterangan_kondisi} onChange={handleInputChange} />
          </FormSection>

          {/* Info Tambahan */}
          <FormSection title="Info Tambahan">
            <select name="prioritas_service" value={formData.prioritas_service} onChange={handleInputChange} className="w-full p-2 border rounded-md">
              <option value="1. Reguler">1. Reguler</option>
              <option value="2. Prioritas">2. Prioritas</option>
              <option value="3. Onsite">3. Onsite</option>
            </select>

            <InputField label="Traking Number Service" placeholder="Traking Number Service" name="track_number" value={formData.track_number} onChange={() => {}} /> {/* readonly */}
            <InputField label="Penerima Service" placeholder="Penerima Service" name="penerima_service" value={formData.penerima_service} onChange={handleInputChange} />
          </FormSection>

          {/* Submit */}
          <div className="flex space-x-4">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700">
              Submit Only
            </button>
          </div>
                      {/* 🔻 Error & Success Message muncul di bawah tombol submit */}
            <div className="mt-4 space-y-2">
              {errors.length > 0 && (
                <div className="bg-red-100 text-red-700 p-3 rounded-md">
                  <ul>
                    {errors.map((err, idx) => (
                      <li key={idx}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {successMessage && (
                <div className="bg-green-100 text-green-700 p-3 rounded-md">
                  {successMessage}
                </div>
              )}
            </div>
        </form>
      </main>
    </div>
    </ProtectedRoute>
  );
}

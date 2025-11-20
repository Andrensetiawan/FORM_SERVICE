"use client";

import { useState } from "react";
import InputField from "@/app/components/inputfield";
import FormSection from "@/app/components/formsection";
import NavbarSwitcher from "@/app/components/navbars/NavbarSwitcher";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { generateTrackNumber } from "@/lib/trackNumber";
import useAuth from "@/hooks/useAuth";

export default function FormService() {
  const { role, loading } = useAuth();

  const initialForm = {
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
  };

  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleCheckbox = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => {
      const selected = prev[field] as string[];
      const updated = selected.includes(value)
        ? selected.filter((x) => x !== value)
        : [...selected, value];
      return { ...prev, [field]: updated };
    });
  };

  const handleGaransi = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, garansi: e.target.value === "Ya" }));
  };

  const validateForm = () => {
    const newErrors: string[] = [];
    const required: (keyof typeof formData)[] = [
      "nama",
      "alamat",
      "no_hp",
      "email",
      "merk",
      "tipe",
      "serial_number",
      "keluhan",
      "spesifikasi_teknis",
      "penerima_service",
      "cabang",
    ];

    required.forEach((f) => {
      if (!String(formData[f]).trim()) newErrors.push(`${f.replace("_", " ")} wajib diisi.`);
    });

    if (formData.jenis_perangkat.length === 0)
      newErrors.push("Pilih minimal 1 jenis perangkat.");
    if (formData.accessories.length === 0)
      newErrors.push("Pilih minimal 1 accessories.");
    if (formData.kondisi.length === 0)
      newErrors.push("Pilih minimal 1 kondisi perangkat.");

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const newTrackNumber = await generateTrackNumber(formData.cabang);

      const dataToSave = {
        ...formData,
        track_number: newTrackNumber,
        status: "pending",
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, "service_requests"), dataToSave);

      setSuccessMessage(`✅ Data berhasil disimpan! Nomor Service: ${newTrackNumber}`);

      setFormData(initialForm);
      setErrors([]);
    } catch (err) {
      console.error("❌ Gagal menyimpan data:", err);
      setErrors(["Gagal menyimpan data ke Firestore."]);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Memuat data pengguna...
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="bg-white min-h-screen">
        <NavbarSwitcher />
          <main className="max-w-4xl mx-auto p-6 pt-24 space-y-6 text-black">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold">📋 Form Service </h1>
            <p className="text-gray-500">Cekatan, Aman, dan Terpercaya</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Customer */}
            <FormSection title="🧍 Data Customer">
              <InputField label="Nama" name="nama" value={formData.nama} onChange={handleInputChange} />
              <InputField label="Alamat" name="alamat" textarea value={formData.alamat} onChange={handleInputChange} />
              <InputField label="No. Handphone" name="no_hp" value={formData.no_hp} onChange={handleInputChange} />
              <InputField label="Email" name="email" value={formData.email} onChange={handleInputChange} />
            </FormSection>

            {/* Perangkat */}
            <FormSection title="💻 Data Perangkat">
              <InputField label="Merk" name="merk" value={formData.merk} onChange={handleInputChange} />
              <InputField label="Tipe" name="tipe" value={formData.tipe} onChange={handleInputChange} />
              <InputField label="Serial Number" name="serial_number" value={formData.serial_number} onChange={handleInputChange} />
              <InputField label="Keluhan" textarea name="keluhan" value={formData.keluhan} onChange={handleInputChange} />
              <InputField label="Spesifikasi Teknis" textarea name="spesifikasi_teknis" value={formData.spesifikasi_teknis} onChange={handleInputChange} />
            </FormSection>

            {/* Jenis Perangkat */}
            <FormSection title="🔧 Jenis Perangkat">
              <div className="flex flex-wrap gap-4">
                {["Laptop", "PC", "UPS", "Console"].map((d) => (
                  <label key={d} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={formData.jenis_perangkat.includes(d)}
                      onChange={() => toggleCheckbox("jenis_perangkat", d)}
                    />
                    <span>{d}</span>
                  </label>
                ))}
              </div>
              <InputField label="Keterangan" name="keterangan_perangkat" value={formData.keterangan_perangkat} onChange={handleInputChange} />
            </FormSection>

            {/* Accessories */}
            <FormSection title="🎒 Accessories">
              <div className="flex flex-wrap gap-4">
                {["Baterai", "Adaptor", "Tas", "Casing", "Mouse", "Receiver"].map((acc) => (
                  <label key={acc} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={formData.accessories.includes(acc)}
                      onChange={() => toggleCheckbox("accessories", acc)}
                    />
                    <span>{acc}</span>
                  </label>
                ))}
              </div>
              <InputField label="Keterangan Accessories" name="keterangan_accessories" value={formData.keterangan_accessories} onChange={handleInputChange} />
            </FormSection>

            {/* Garansi */}
            <FormSection title="🧾 Garansi">
              <div className="flex space-x-6">
                {["Ya", "Tidak"].map((val) => (
                  <label key={val} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="garansi"
                      value={val}
                      checked={formData.garansi === (val === "Ya")}
                      onChange={handleGaransi}
                      className="w-4 h-4"
                    />
                    <span>{val}</span>
                  </label>
                ))}
              </div>
              <InputField label="Keterangan Garansi" name="keterangan_garansi" value={formData.keterangan_garansi} onChange={handleInputChange} />
            </FormSection>

            {/* Kondisi Saat Masuk */}
            <FormSection title="🔍 Kondisi Saat Masuk">
              <div className="grid grid-cols-2 gap-3">
                {[
                  "Mati Total", "Layar Gelap", "Layar Biru", "Bekas Jatuh",
                  "Chasing Pecah", "Pernah Dibongkar", "Baret", "Retak", "Kotor / Berdebu",
                ].map((c) => (
                  <label key={c} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={formData.kondisi.includes(c)}
                      onChange={() => toggleCheckbox("kondisi", c)}
                    />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
              <InputField label="Keterangan" name="keterangan_kondisi" value={formData.keterangan_kondisi} onChange={handleInputChange} />
            </FormSection>

            {/* Cabang */}
            <FormSection title="🏢 Informasi Cabang">
              <select
                name="cabang"
                value={formData.cabang}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">-- Pilih Cabang --</option>
                <option value="Alifcyber Solution">Alifcyber Solution</option>
                <option value="Hibatillah">Hibatillah</option>
              </select>
            </FormSection>

            {/* Info Tambahan */}
            <FormSection title="🗂️ Info Tambahan">
              <select
                name="prioritas_service"
                value={formData.prioritas_service}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
              >
                <option value="1. Reguler">1. Reguler</option>
                <option value="2. Prioritas">2. Prioritas</option>
                <option value="3. Onsite">3. Onsite</option>
              </select>

              <InputField
                label="Tracking Number"
                name="track_number"
                value={formData.track_number}
                onChange={() => {}}
                readOnly
              />

              <InputField
                label="Penerima Service"
                name="penerima_service"
                value={formData.penerima_service}
                onChange={handleInputChange}
              />
            </FormSection>

            {/* Submit */}
            <div className="flex justify-end">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 shadow">
                Simpan
              </button>
            </div>

            {/* Alerts */}
            {errors.length > 0 && (
              <div className="bg-red-100 text-red-700 p-3 rounded-md">
                <ul>{errors.map((err, idx) => <li key={idx}>• {err}</li>)}</ul>
              </div>
            )}
            {successMessage && (
              <div className="bg-green-100 text-green-700 p-3 rounded-md">
                {successMessage}
              </div>
            )}
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}

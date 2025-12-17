"use client";

import { useState, useEffect } from "react";
import InputField from "@/components/inputfield";
import FormSection from "@/components/formsection";
import NavbarSwitcher from "@/components/navbars/NavbarSwitcher";
import ProtectedRoute from "@/components/ProtectedRoute";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";
import { generateTrackNumber } from "@/lib/trackNumber";
import useAuth from "@/hooks/useAuth";
import { createLog } from "@/lib/log";

export default function FormService() {
  const { user, role, loading } = useAuth();

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
    penerima_service: "",
    cabang: "",
  };

  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState("");

  const [cabangOptions, setCabangOptions] = useState<string[]>([]);
  const [loadingCabang, setLoadingCabang] = useState(true);

  //=====================================================
  // DAFTAR CABANG DARI FIRESTORE
  //=====================================================
  useEffect(() => {
    const fetchCabangs = async () => {
      try {
        const snap = await getDocs(collection(db, "cabangs"));
        const arr = snap.docs
          .map((d) => (d.data() as any).name)
          .sort((a, b) => a.localeCompare(b));
        setCabangOptions(arr);
      } catch (err) {
        console.error("Gagal ambil cabang:", err);
      } finally {
        setLoadingCabang(false);
      }
    };

    fetchCabangs();
  }, []);

  //=====================================================
  // INPUT HANDLER
  //=====================================================
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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

  //=====================================================
  // VALIDASI
  //=====================================================
  const validateForm = () => {
    const missing: string[] = [];

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
      if (!String(formData[f]).trim()) missing.push(`${f} wajib diisi.`);
    });

    if (formData.jenis_perangkat.length === 0)
      missing.push("Pilih minimal 1 jenis perangkat.");
    if (formData.accessories.length === 0)
      missing.push("Pilih minimal 1 accessories.");
    if (formData.kondisi.length === 0)
      missing.push("Pilih minimal 1 kondisi perangkat.");

    setErrors(missing);
    return missing.length === 0;
  };

  //=====================================================
  // SUBMIT
  //=====================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const track = await generateTrackNumber();

      const payload = {
        ...formData,
        track_number: track,
        status: "pending",
        created_by: user?.uid ?? null,
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, "service_requests"), payload);

      await createLog({
        uid: user?.uid ?? "",
        role: role ?? "unknown",
        action: "create_service_request",
        target: track,
      });

      setSuccessMessage(`Berhasil tersimpan 🎉 Tracking: ${track}`);
      setFormData(initialForm);
      setErrors([]);
    } catch (err) {
      console.error("Error:", err);
      setErrors(["Gagal menyimpan data ke Firestore"]);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Memuat...
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="bg-gray-100 min-h-screen">
        <NavbarSwitcher />

        <main className="max-w-4xl mx-auto p-6 pt-24 space-y-6 text-gray-900">
          <div className="bg-white p-6 rounded-2xl shadow-lg space-y-6">
            <h1 className="text-center text-3xl font-extrabold">
              📋 Form Service
            </h1>
            <p className="text-center text-gray-600 -mt-4">
              Cepat, Aman, dan Terpercaya
            </p>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* ================= CUSTOMER ================= */}
              <FormSection title="🧍 Data Customer">
                <InputField label="Nama" name="nama" value={formData.nama} onChange={handleInputChange} />
                <InputField label="Alamat" name="alamat" textarea value={formData.alamat} onChange={handleInputChange} />
                <InputField label="No HP" name="no_hp" value={formData.no_hp} onChange={handleInputChange} />
                <InputField label="Email" name="email" value={formData.email} onChange={handleInputChange} />
              </FormSection>

              {/* ================= DEVICE ================= */}
              <FormSection title="💻 Data Perangkat">
                <InputField label="Merk" name="merk" value={formData.merk} onChange={handleInputChange} />
                <InputField label="Tipe" name="tipe" value={formData.tipe} onChange={handleInputChange} />
                <InputField label="Serial Number" name="serial_number" value={formData.serial_number} onChange={handleInputChange} />
                <InputField label="Keluhan" textarea name="keluhan" value={formData.keluhan} onChange={handleInputChange} />
                <InputField label="Spesifikasi Teknis" textarea name="spesifikasi_teknis" value={formData.spesifikasi_teknis} onChange={handleInputChange} />
              </FormSection>

              {/* ================= JENIS PERANGKAT ================= */}
              <FormSection title="🔧 Jenis Perangkat">
                {["Laptop", "PC", "UPS", "Console"].map((d) => (
                  <label key={d} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.jenis_perangkat.includes(d)}
                      onChange={() => toggleCheckbox("jenis_perangkat", d)}
                    />
                    {d}
                  </label>
                ))}
                <InputField label="Keterangan Perangkat" name="keterangan_perangkat" value={formData.keterangan_perangkat} onChange={handleInputChange} />
              </FormSection>

              {/* ================= ACCESSORIES ================= */}
              <FormSection title="🎒 Accessories">
                {["Baterai", "Adaptor", "Tas", "Casing", "Mouse", "Receiver"].map((a) => (
                  <label key={a} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.accessories.includes(a)}
                      onChange={() => toggleCheckbox("accessories", a)}
                    />
                    {a}
                  </label>
                ))}
                <InputField label="Keterangan Accessories" name="keterangan_accessories" value={formData.keterangan_accessories} onChange={handleInputChange} />
              </FormSection>

              {/* ================= GARANSI ================= */}
              <FormSection title="🧾 Garansi">
                {["Ya", "Tidak"].map((g) => (
                  <label key={g} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="garansi"
                      value={g}
                      checked={formData.garansi === (g === "Ya")}
                      onChange={handleGaransi}
                    />
                    {g}
                  </label>
                ))}
                <InputField label="Keterangan Garansi" name="keterangan_garansi" value={formData.keterangan_garansi} onChange={handleInputChange} />
              </FormSection>

              {/* ================= KONDISI ================= */}
              <FormSection title="🔍 Kondisi Saat Masuk">
                {[
                  "Mati Total",
                  "Layar Gelap",
                  "Layar Biru",
                  "Bekas Jatuh",
                  "Chasing Pecah",
                  "Baret",
                  "Retak",
                  "Kotor / Berdebu",
                ].map((k) => (
                  <label key={k} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.kondisi.includes(k)}
                      onChange={() => toggleCheckbox("kondisi", k)}
                    />
                    {k}
                  </label>
                ))}
                <InputField label="Keterangan Kondisi" name="keterangan_kondisi" value={formData.keterangan_kondisi} onChange={handleInputChange} />
              </FormSection>

              {/* ================= CABANG ================= */}
              <FormSection title="🏢 Pilih Cabang">
                <select
                  name="cabang"
                  value={formData.cabang}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md bg-white"
                >
                  <option value="">-- Pilih Cabang --</option>
                  {!loadingCabang &&
                    cabangOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1 italic">
                  Cabang otomatis dari profil kamu
                </p>
              </FormSection>

              {/* ================= ADDITIONAL ================= */}
              <FormSection title="🗂 Info Tambahan">
                <select
                  name="prioritas_service"
                  value={formData.prioritas_service}
                  onChange={handleInputChange}
                >
                  <option value="1. Reguler">1. Reguler</option>
                  <option value="2. Prioritas">2. Prioritas</option>
                  <option value="3. Onsite">3. Onsite</option>
                </select>

                <InputField label="Penerima Service" name="penerima_service" value={formData.penerima_service} onChange={handleInputChange} />
              </FormSection>

              {/* ================= SUBMIT ================= */}
              <div className="flex justify-end">
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow">
                  Simpan
                </button>
              </div>

              {errors.length > 0 && (
                <div className="bg-red-100 text-red-600 p-3 rounded-lg">
                  {errors.map((e, i) => (
                    <div key={i}>• {e}</div>
                  ))}
                </div>
              )}

              {successMessage && (
                <div className="bg-green-100 text-green-700 p-3 rounded-lg font-semibold">
                  {successMessage}
                </div>
              )}
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

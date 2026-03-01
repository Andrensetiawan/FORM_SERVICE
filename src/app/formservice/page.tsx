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
  setDoc,
} from "firebase/firestore";
import { generateTrackNumber } from "@/lib/trackNumber";
import useAuth from "@/hooks/useAuth";
import { createLog } from "@/lib/log";
import toast from "react-hot-toast";
import { auth } from "@/lib/firebaseConfig";

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

const isInternalRole = (role?: string | null) =>
  !!role && ["admin", "owner", "manager", "staff"].includes(role);

const buildFallbackTrackNumber = () => {
  const timePart = Date.now().toString(36).toUpperCase();
  const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PUB-${timePart}-${randPart}`;
};

// Define the type for the form data to be used in email/whatsapp info
type FormDataType = typeof initialForm;

export default function FormService() {
  const { user, role, loading } = useAuth();

  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState("");

  const [waInfo, setWaInfo] = useState<{ phone: string; message: string } | null>(null);
  const [emailInfo, setEmailInfo] = useState<{ to: string, subject: string, data: FormDataType & {track: string, docId: string} } | null>(null);
  
  const [agreeToWhatsApp, setAgreeToWhatsApp] = useState(true);
  const [agreeToEmail, setAgreeToEmail] = useState(true);
  
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
  // Auto-fill form from user profile
  //=====================================================
  useEffect(() => {
    if (user) {
      const updates: { cabang?: string; penerima_service?: string } = {};
      if (user.cabang) {
        updates.cabang = user.cabang;
      }
      if (user.displayName) {
        updates.penerima_service = user.displayName;
      }
      if (Object.keys(updates).length > 0) {
        setFormData((prev) => ({ ...prev, ...updates }));
      }
    }
  }, [user]);

  //=====================================================
  // INPUT HANDLER
  //=====================================================
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccessMessage("");
    setWaInfo(null);
    setEmailInfo(null);
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
    
    // Validasi Nomor HP
    const phoneRegex = /^(08|628)\d{8,15}$/;
    if (formData.no_hp && !phoneRegex.test(formData.no_hp.replace(/\D/g, ''))) {
      missing.push("Format Nomor HP tidak valid. Gunakan format 08... atau 62...");
    }

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
  // WHATSAPP & EMAIL HELPERS
  //=====================================================
  const sendToWhatsApp = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/^0/, "62").replace(/\D/g, "");
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const sendEmailNotification = () => {
    if (!emailInfo) return;

    const { to, subject, data } = emailInfo;
    const directLink = `${window.location.origin}/tns/${data.docId}`;

    const emailBody = `
Halo ${data.nama},

Permintaan service kamu sudah kami terima pada ${new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })} ✅

Berikut detailnya:
-------------------------
INFORMASI CUSTOMER
-------------------------
Nama: ${data.nama}
No HP: ${data.no_hp}
Alamat: ${data.alamat}

-------------------------
INFORMASI SERVICE
-------------------------
No. Service: ${data.track}
Penerima: ${data.penerima_service}
Prioritas: ${data.prioritas_service}
Cabang: ${data.cabang}

-------------------------
INFORMASI PERANGKAT
-------------------------
Perangkat: ${data.merk} ${data.tipe}
Serial Number: ${data.serial_number}
Keluhan: ${data.keluhan}
Kondisi Awal: ${data.kondisi.join(", ")}
Garansi: ${data.garansi ? "Ya" : "Tidak"}

-------------------------

Cek status service Anda secara real-time melalui link berikut:
${directLink}

Kami akan menghubungi Anda kembali setelah proses pengecekan selesai.
Terima kasih 🙏
`.trim();

    const gmailUrl = new URL("https://mail.google.com/mail/");
    gmailUrl.searchParams.set("view", "cm");
    gmailUrl.searchParams.set("fs", "1");
    gmailUrl.searchParams.set("to", to);
    gmailUrl.searchParams.set("su", subject);
    gmailUrl.searchParams.set("body", emailBody);
    
    window.open(gmailUrl.toString(), "_blank");
  };

  //=====================================================
  // SUBMIT
  //=====================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Normalisasi Nomor HP ke format 62
    const normalizePhoneNumber = (phone: string): string => {
      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.startsWith('08')) {
        return `62${digitsOnly.substring(1)}`;
      }
      return digitsOnly;
    };

    const normalizedPhone = normalizePhoneNumber(formData.no_hp);
    const canUseProtectedCounter = isInternalRole(role);
    let track = buildFallbackTrackNumber();

    if (canUseProtectedCounter) {
      try {
        track = await generateTrackNumber();
      } catch (counterErr) {
        console.warn("Gagal menggunakan counter internal, pakai fallback nomor pelacakan.", counterErr);
      }
    }

    try {
      const generateToken = () => {
        try {
          const arr = crypto.getRandomValues(new Uint8Array(24));
          return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
        } catch (e) {
          // Fallback
          return Math.random().toString(36).slice(2) + Date.now().toString(36);
        }
      };

      const publicToken = generateToken();

      const payload = {
        ...formData,
        no_hp: normalizedPhone,
        track_number: track,
        status: "pending",
        created_by: user?.uid ?? null,
        timestamp: serverTimestamp(),
        public_view_token: publicToken,
      };

      const docRef = await addDoc(collection(db, "service_requests"), payload);
      const docId = docRef.id;

      const publicData = {
        docId,
        track: track,
        createdAt: serverTimestamp(),
        // Subset of fields safe to show publicly (customer can view status and estimates)
        public: {
          track_number: track,
          status: "pending",
          timestamp: serverTimestamp(),
          estimasi_items: [],
          total_biaya: 0,
          dp: 0,
        },
      };

      await setDoc(doc(db, "public_views", publicToken), publicData);

      await createLog({
        uid: user?.uid ?? "",
        role: role ?? "unknown",
        action: "create_service_request",
        target: track,
      });

      setSuccessMessage(`Berhasil tersimpan 🎉 Tracking: ${track}`);

      if (agreeToWhatsApp) {
        const publicLink = `${window.location.origin}/public/${publicToken}`;
        const waMessage = `
Halo ${formData.nama},

Permintaan service kamu sudah kami terima pada ${new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })} ✅

Berikut detailnya:
-------------------------
INFORMASI CUSTOMER
-------------------------
Nama: ${formData.nama}
No HP: ${formData.no_hp}
Alamat: ${formData.alamat}

-------------------------
INFORMASI SERVICE
-------------------------
No. Service: ${track}
Penerima: ${formData.penerima_service}
Prioritas: ${formData.prioritas_service}
Cabang: ${formData.cabang}

-------------------------
INFORMASI PERANGKAT
-------------------------
Perangkat: ${formData.merk} ${formData.tipe}
Serial Number: ${formData.serial_number}
Keluhan: ${formData.keluhan}
Kondisi Awal: ${formData.kondisi.join(", ")}
Garansi: ${formData.garansi ? "Ya" : "Tidak"}

-------------------------

Cek status service Anda secara real-time melalui link berikut:
${publicLink}

⚠️ PENTING:
Mohon diperhatikan bahwa kami menerapkan Biaya Pengecekan (Cancel Fee) senilai Rp50.000 - Rp100.000 (tergantung tingkat kerusakan). Biaya ini wajib dibayarkan apabila proses perbaikan dibatalkan setelah pengecekan dilakukan.

Kami akan menghubungi Anda kembali setelah proses pengecekan selesai.
Terima kasih 🙏
`;
        setWaInfo({ phone: normalizedPhone, message: waMessage });
      }

      if (agreeToEmail && formData.email) {
        setEmailInfo({
          to: formData.email,
          subject: `Konfirmasi Permintaan Service #${track}`,
          data: { ...formData, track, docId },
        });
      }

      setFormData(initialForm);
      setErrors([]);
    } catch (err: any) {
      console.error("Firestore write error:", err?.code, err?.message, err);
      setErrors([`Gagal menyimpan data ke Firestore: ${err?.message || err?.code || "periksa console"}`]);
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

                <div>
                  <InputField label="Penerima Service" name="penerima_service" value={formData.penerima_service} onChange={handleInputChange} />
                  <p className="text-xs text-gray-500 mt-1 italic">
                    Nama penerima otomatis dari profil kamu
                  </p>
                </div>
              </FormSection>

              {/* ================= SUBMIT ================= */}
              <div className="border-t pt-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center gap-3">
                      <input
                        id="wa-consent"
                        type="checkbox"
                        checked={agreeToWhatsApp}
                        onChange={(e) => setAgreeToWhatsApp(e.target.checked)}
                        className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="wa-consent" className="text-sm text-gray-700">
                        Notifikasi via WhatsApp.
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        id="email-consent"
                        type="checkbox"
                        checked={agreeToEmail}
                        onChange={(e) => setAgreeToEmail(e.target.checked)}
                        className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="email-consent" className="text-sm text-gray-700">
                        Notifikasi via Email.
                      </label>
                    </div>
                </div>

                <div className="flex justify-end">
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow">
                    Simpan
                  </button>
                </div>
              </div>


              {errors.length > 0 && (
                <div className="bg-red-100 text-red-600 p-3 rounded-lg">
                  {errors.map((e, i) => (
                    <div key={i}>• {e}</div>
                  ))}
                </div>
              )}

              {successMessage && (
                <div className="bg-green-100 text-green-700 p-4 rounded-lg font-semibold space-y-3">
                  <p>{successMessage}</p>
                  <div className="flex flex-wrap gap-3">
                    {waInfo && (
                      <button
                        type="button"
                        onClick={() => sendToWhatsApp(waInfo.phone, waInfo.message)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-md text-sm font-bold"
                      >
                        Kirim Notifikasi WhatsApp
                      </button>
                    )}
                    {emailInfo && (
                      <button
                        type="button"
                        onClick={sendEmailNotification}
                        className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 shadow-md text-sm font-bold"
                      >
                        Kirim Notifikasi Email
                      </button>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  KeyRound,
  Shield,
  Clock,
  Save,
  ChevronLeft,
  Info,
  Loader,
} from "lucide-react";
import NavbarSwitcher from "@/components/navbars/NavbarSwitcher";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

// A simple toggle switch component
const ToggleSwitch = ({
  label,
  enabled,
  onChange,
}: {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) => (
  <label className="flex items-center justify-between cursor-pointer">
    <span className="font-medium text-gray-700">{label}</span>
    <div
      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
        enabled ? "bg-blue-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
          enabled ? "transform translate-x-6" : ""
        }`}
      />
    </div>
  </label>
);

export default function SecuritySettingsPage() {
  const router = useRouter();

  // State for the settings, with initial default values
  const [loading, setLoading] = useState(true);
  const [passwordLength, setPasswordLength] = useState(8);
  const [requireUppercase, setRequireUppercase] = useState(true);
  const [requireNumbers, setRequireNumbers] = useState(true);
  const [requireSymbols, setRequireSymbols] = useState(false);
  const [enforceMfa, setEnforceMfa] = useState(false);
  const [sessionTimeoutEnabled, setSessionTimeoutEnabled] = useState(true);
  const [adminSessionDuration, setAdminSessionDuration] = useState(8);
  const [managerSessionDuration, setManagerSessionDuration] = useState(12);
  const [staffSessionDuration, setStaffSessionDuration] = useState(24);
  const [saving, setSaving] = useState(false);

  // Fetch settings on component mount via API route
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/settings/security");

        if (!response.ok) {
          throw new Error("Failed to fetch settings.");
        }

        const settings = await response.json();
        if (Object.keys(settings).length > 0) {
          setPasswordLength(settings.passwordLength ?? 8);
          setRequireUppercase(settings.requireUppercase ?? true);
          setRequireNumbers(settings.requireNumbers ?? true);
          setRequireSymbols(settings.requireSymbols ?? false);
          setEnforceMfa(settings.enforceMfa ?? false);
          setSessionTimeoutEnabled(settings.sessionTimeoutEnabled ?? true);
          setAdminSessionDuration(settings.adminSessionDuration ?? 8);
          setManagerSessionDuration(settings.managerSessionDuration ?? 12);
          setStaffSessionDuration(settings.staffSessionDuration ?? 24);
        }
      } catch (error: any) {
        console.error("Error fetching security settings:", error);
        toast.error(error.message || "Gagal memuat pengaturan.");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    toast.loading("Menyimpan pengaturan...", { id: "saving" });

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }
      const token = await user.getIdToken();

      const settingsToSave = {
        passwordLength,
        requireUppercase,
        requireNumbers,
        requireSymbols,
        enforceMfa,
        sessionTimeoutEnabled,
        adminSessionDuration,
        managerSessionDuration,
        staffSessionDuration,
      };

      const response = await fetch("/api/settings/security", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settingsToSave),
      });

      if (!response.ok) {
        throw new Error("Gagal menyimpan pengaturan.");
      }
      
      toast.dismiss("saving");
      toast.success("Pengaturan keamanan berhasil disimpan!");
    } catch (error: any) {
      console.error("Error saving security settings:", error);
      toast.dismiss("saving");
      toast.error(error.message || "Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <>
      <NavbarSwitcher />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft size={24} className="text-gray-600" />
              </button>
              <h1 className="text-3xl font-extrabold text-gray-900">
                Keamanan & Akses
              </h1>
            </div>
            <p className="text-gray-600 text-lg ml-14 -mt-4">
              Atur kebijakan keamanan, autentikasi, dan sesi untuk aplikasi
              Anda.
            </p>
          </motion.div>

          <div className="mt-10 space-y-8">
            {/* Password Policy Section */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200"
            >
              <div className="flex items-center gap-4 mb-6">
                <KeyRound size={28} className="text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-800">
                  Kebijakan Kata Sandi
                </h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="passwordLength"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Panjang Karakter Minimum
                  </label>
                  <input
                    id="passwordLength"
                    type="number"
                    value={passwordLength}
                    onChange={(e) => setPasswordLength(parseInt(e.target.value, 10))}
                    className="w-full max-w-xs p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-4 pt-4 border-t">
                  <ToggleSwitch
                    label="Wajibkan Huruf Kapital (A-Z)"
                    enabled={requireUppercase}
                    onChange={setRequireUppercase}
                  />
                  <ToggleSwitch
                    label="Wajibkan Angka (0-9)"
                    enabled={requireNumbers}
                    onChange={setRequireNumbers}
                  />
                  <ToggleSwitch
                    label="Wajibkan Simbol (!@#$...)"
                    enabled={requireSymbols}
                    onChange={setRequireSymbols}
                  />
                </div>
              </div>
            </motion.div>

            {/* Multi-Factor Authentication Section */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200"
            >
              <div className="flex items-center gap-4 mb-6">
                <Shield size={28} className="text-green-600" />
                <h2 className="text-2xl font-bold text-gray-800">
                  Autentikasi Multi-Faktor (MFA)
                </h2>
              </div>
              <div className="space-y-4">
                <ToggleSwitch
                  label="Wajibkan MFA untuk semua pengguna Admin & Manager"
                  enabled={enforceMfa}
                  onChange={setEnforceMfa}
                />
                <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg mt-4">
                  <Info size={20} className="mt-0.5 flex-shrink-0" />
                  <p className="text-sm">
                    Fitur ini akan mewajibkan pengguna dengan role penting untuk
                    mengaktifkan metode autentikasi kedua (seperti Google
                    Authenticator atau SMS) saat login.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Session Management Section */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200"
            >
              <div className="flex items-center gap-4 mb-6">
                <Clock size={28} className="text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-800">
                  Manajemen Sesi
                </h2>
              </div>
              <div className="space-y-4">
                <ToggleSwitch
                  label="Aktifkan Logout Otomatis"
                  enabled={sessionTimeoutEnabled}
                  onChange={setSessionTimeoutEnabled}
                />

                {sessionTimeoutEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.4 }}
                    className="space-y-4 pt-4 mt-4 border-t"
                  >
                    <div>
                      <label
                        htmlFor="adminSessionDuration"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Durasi Sesi Admin & Owner (jam)
                      </label>
                      <input
                        id="adminSessionDuration"
                        type="number"
                        value={adminSessionDuration}
                        onChange={(e) =>
                          setAdminSessionDuration(parseInt(e.target.value, 10))
                        }
                        className="w-full max-w-xs p-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="managerSessionDuration"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Durasi Sesi Manager (jam)
                      </label>
                      <input
                        id="managerSessionDuration"
                        type="number"
                        value={managerSessionDuration}
                        onChange={(e) =>
                          setManagerSessionDuration(parseInt(e.target.value, 10))
                        }
                        className="w-full max-w-xs p-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="staffSessionDuration"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Durasi Sesi Staff (jam)
                      </label>
                      <input
                        id="staffSessionDuration"
                        type="number"
                        value={staffSessionDuration}
                        onChange={(e) =>
                          setStaffSessionDuration(parseInt(e.target.value, 10))
                        }
                        className="w-full max-w-xs p-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 pt-2">
                      Pengguna akan otomatis logout setelah tidak aktif selama periode yang ditentukan.
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-12 flex justify-end"
          >
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-8 py-3 rounded-lg text-white font-semibold shadow-xl transition-all duration-300 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105"
            >
              <Save size={20} />
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </motion.div>
        </div>
      </div>
    </>
  );
}

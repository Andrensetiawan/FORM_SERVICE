"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Bell, Save, ChevronLeft, Info } from "lucide-react";
import NavbarSwitcher from "@/components/navbars/NavbarSwitcher";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// A simple toggle switch component
const ToggleSwitch = ({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description?: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) => (
  <label className="flex items-center justify-between cursor-pointer p-4 rounded-lg hover:bg-gray-50">
    <div>
      <p className="font-medium text-gray-800">{label}</p>
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
    </div>
    <div
      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
        enabled ? "bg-blue-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${
          enabled ? "transform translate-x-6" : ""
        }`}
      />
    </div>
  </label>
);

export default function NotificationSettingsPage() {
  const router = useRouter();
  
  // States for UI mock-up
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [senderName, setSenderName] = useState("Form Service");
  const [senderEmail, setSenderEmail] = useState("noreply@formservice.app");
  
  const [emailOnStatusChange, setEmailOnStatusChange] = useState(true);
  const [emailOnNewUser, setEmailOnNewUser] = useState(true);
  const [emailDailyReport, setEmailDailyReport] = useState(false);

  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [whatsappOnStatusChange, setWhatsappOnStatusChange] = useState(true);
  
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    toast.loading("Menyimpan pengaturan notifikasi...", { id: "saving" });
    setTimeout(() => {
      setSaving(false);
      toast.dismiss("saving");
      toast.success("Pengaturan berhasil disimpan!");
    }, 1500);
  };

  return (
    <>
      <NavbarSwitcher />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft size={24} className="text-gray-600" />
              </button>
              <h1 className="text-3xl font-extrabold text-gray-900">
                Notifikasi
              </h1>
            </div>
            <p className="text-gray-600 text-lg ml-14 -mt-4">
              Atur pengiriman email dan notifikasi otomatis lainnya.
            </p>
          </motion.div>

          <div className="mt-10 space-y-8">
            {/* Email Notifications Section */}
            <motion.div className="bg-white p-8 rounded-2xl shadow-lg border" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <div className="flex items-center gap-4 mb-6">
                <Mail size={28} className="text-red-600" />
                <h2 className="text-2xl font-bold text-gray-800">Notifikasi Email</h2>
              </div>
              <div className="space-y-6">
                <ToggleSwitch label="Aktifkan Notifikasi Email" enabled={emailEnabled} onChange={setEmailEnabled}/>
                
                {emailEnabled && (
                  <motion.div className="space-y-6 pt-6 border-t" initial={{ opacity: 0}} animate={{ opacity: 1}} transition={{delay: 0.2}}>
                    <div>
                      <label htmlFor="senderName" className="block text-sm font-medium text-gray-700 mb-2">Nama Pengirim</label>
                      <input id="senderName" type="text" value={senderName} onChange={e => setSenderName(e.target.value)} className="w-full max-w-md p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div>
                      <label htmlFor="senderEmail" className="block text-sm font-medium text-gray-700 mb-2">Email Pengirim</label>
                      <input id="senderEmail" type="email" value={senderEmail} onChange={e => setSenderEmail(e.target.value)} className="w-full max-w-md p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"/>
                    </div>

                    <div className="divide-y rounded-lg border">
                      <ToggleSwitch label="Status Permintaan Service" description="Kirim email ke customer saat status service request berubah." enabled={emailOnStatusChange} onChange={setEmailOnStatusChange} />
                      <ToggleSwitch label="Registrasi Pengguna Baru" description="Kirim email ke admin saat ada pengguna baru mendaftar." enabled={emailOnNewUser} onChange={setEmailOnNewUser} />
                      <ToggleSwitch label="Laporan Harian" description="Kirim ringkasan laporan harian ke Manajer & Owner." enabled={emailDailyReport} onChange={setEmailDailyReport} />
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* WhatsApp Notifications Section */}
            <motion.div className="bg-white p-8 rounded-2xl shadow-lg border" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <div className="flex items-center gap-4 mb-6">
                <MessageSquare size={28} className="text-green-600" />
                <h2 className="text-2xl font-bold text-gray-800">Notifikasi WhatsApp</h2>
              </div>
              <div className="space-y-4">
                <ToggleSwitch label="Aktifkan Notifikasi WhatsApp" enabled={whatsappEnabled} onChange={setWhatsappEnabled}/>
                
                {whatsappEnabled && (
                  <motion.div className="space-y-4 pt-6 border-t" initial={{ opacity: 0}} animate={{ opacity: 1}} transition={{delay: 0.2}}>
                    <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg">
                      <Info size={20} className="mt-0.5 flex-shrink-0" />
                      <p className="text-sm">
                        Membutuhkan konfigurasi API Provider WhatsApp Business (e.g., Meta Cloud API, WATI). Hubungi developer untuk setup.
                      </p>
                    </div>
                    <div className="divide-y rounded-lg border">
                        <ToggleSwitch label="Status Permintaan Service" description="Kirim notifikasi WA ke customer saat status berubah." enabled={whatsappOnStatusChange} onChange={setWhatsappOnStatusChange} />
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>

          </div>

          {/* Save Button */}
          <motion.div className="mt-12 flex justify-end" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-8 py-3 rounded-lg text-white font-semibold shadow-xl transition-all bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
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

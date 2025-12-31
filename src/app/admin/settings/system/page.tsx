"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Database,
  Download,
  Trash2,
  Upload,
  ChevronLeft,
  Server,
  Activity,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import NavbarSwitcher from "@/components/navbars/NavbarSwitcher";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Backup = {
  id: string;
  date: Date;
  size: string;
  initiator: string;
};

const initialBackups: Backup[] = [
  {
    id: "bkp_1",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    size: "15.8 MB",
    initiator: "admin@example.com",
  },
  {
    id: "bkp_2",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    size: "14.2 MB",
    initiator: "system",
  },
];

export default function SystemSettingsPage() {
  const router = useRouter();
  const [backups, setBackups] = useState<Backup[]>(initialBackups);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [apiStatus, setApiStatus] = useState<"OK" | "Error" | null>(null);
  const [isCheckingApi, setIsCheckingApi] = useState(false);

  const handleCreateBackup = () => {
    setIsBackingUp(true);
    toast.loading("Membuat backup baru...", { id: "backup" });

    setTimeout(() => {
      const newBackup: Backup = {
        id: `bkp_${Date.now()}`,
        date: new Date(),
        size: `${(Math.random() * 5 + 15).toFixed(1)} MB`,
        initiator: "admin@example.com", // In a real app, get from auth
      };
      setBackups([newBackup, ...backups]);
      setIsBackingUp(false);
      toast.dismiss("backup");
      toast.success("Backup berhasil dibuat!");
    }, 2500);
  };

  const handleCheckApiStatus = () => {
    setIsCheckingApi(true);
    setApiStatus(null);
    setTimeout(() => {
      setApiStatus("OK");
      setIsCheckingApi(false);
    }, 1200);
  };

  return (
    <>
      <NavbarSwitcher />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft size={24} className="text-gray-600" />
              </button>
              <h1 className="text-3xl font-extrabold text-gray-900">
                Backup & Maintenance
              </h1>
            </div>
            <p className="text-gray-600 text-lg ml-14 -mt-4">
              Kelola backup data dan pantau kesehatan sistem Anda.
            </p>
          </motion.div>

          <div className="mt-10 space-y-8">
            {/* Backup Section */}
            <motion.div
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Database size={28} className="text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-800">
                    Database Backup
                  </h2>
                </div>
                <button
                  onClick={handleCreateBackup}
                  disabled={isBackingUp}
                  className="px-5 py-2.5 rounded-lg text-white font-semibold shadow-lg transition-all bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isBackingUp ? "Memproses..." : "Buat Backup Baru"}
                </button>
              </div>
              <div className="space-y-3">
                {backups.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-100 border"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        {backup.date.toLocaleDateString("id-ID", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {backup.date.toLocaleTimeString("id-ID")} • {backup.size} • Dibuat oleh {backup.initiator}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"><Download size={20}/></button>
                      <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"><Trash2 size={20}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Restore Section */}
            <motion.div
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <Upload size={28} className="text-red-600" />
                <h2 className="text-2xl font-bold text-gray-800">
                  Restore dari Backup
                </h2>
              </div>
              <div className="p-4 border-2 border-dashed rounded-lg text-center">
                  <p className="font-semibold mb-2">Pilih file backup untuk di-restore</p>
                  <input type="file" className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"/>
              </div>
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mt-6">
                  <AlertTriangle size={32} className="mt-0.5 flex-shrink-0" />
                  <p className="text-sm">
                    <b>Perhatian:</b> Melakukan restore akan menimpa semua data saat ini dengan data dari file backup. Tindakan ini tidak dapat dibatalkan.
                  </p>
              </div>
              <button className="w-full mt-6 py-3 rounded-lg text-white font-bold shadow-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-400">
                Restore Data
              </button>
            </motion.div>
            
            {/* System Health Section */}
            <motion.div
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <Server size={28} className="text-green-600" />
                <h2 className="text-2xl font-bold text-gray-800">
                  Kesehatan Sistem
                </h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                    <p className="font-medium text-gray-700">Status Database</p>
                    <div className="flex items-center gap-2 text-green-600 font-semibold">
                        <CheckCircle size={20}/>
                        <span>Terhubung</span>
                    </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                    <p className="font-medium text-gray-700">Status API</p>
                    {apiStatus === 'OK' ? (
                        <div className="flex items-center gap-2 text-green-600 font-semibold"><CheckCircle size={20}/> <span>OK</span></div>
                    ) : (
                        <button onClick={handleCheckApiStatus} disabled={isCheckingApi} className="text-sm font-semibold text-blue-600 hover:underline">
                            {isCheckingApi ? "Memeriksa..." : "Periksa Status"}
                        </button>
                    )}
                </div>
                 <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                    <p className="font-medium text-gray-700">Ukuran Database</p>
                    <p className="font-semibold text-gray-800">~ 25.4 MB</p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </>
  );
}

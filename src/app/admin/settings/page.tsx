"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Database,
  Bell,
  Info
} from "lucide-react";
import NavbarSwitcher from "@/components/navbars/NavbarSwitcher";

const tiles = [
  {
    title: "Keamanan & Akses",
    desc: "Kelola role, izin pengguna, dan autentikasi.",
    icon: ShieldCheck,
    href: "/admin/settings/security",
    variant: "bg-green-100 text-green-600 border-green-200"
  },
  {
    title: "Backup & Maintenance",
    desc: "Backup, restore data & monitor kesehatan sistem.",
    icon: Database,
    href: "/admin/settings/system",
    variant: "bg-purple-100 text-purple-600 border-purple-200"
  },
  {
    title: "Notifikasi",
    desc: "Pengaturan email & notifikasi otomatis.",
    icon: Bell,
    href: "/admin/settings/notifications",
    variant: "bg-yellow-100 text-yellow-700 border-yellow-200"
  },
  {
    title: "Tentang Aplikasi",
    desc: "Versi, lisensi, dan informasi pengembang.",
    icon: Info,
    href: "/admin/settings/about",
    variant: "bg-orange-100 text-orange-600 border-orange-200"
  }
];

export default function SettingsPage() {
  const router = useRouter();

  return (
    <>
    <NavbarSwitcher />
      <div className="min-h-screen bg-white pt-20 px-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-800">
            Pengaturan Sistem
          </h1>
          <p className="text-gray-600 mt-2">
            Kelola branding, keamanan, data, dan konfigurasi aplikasi.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiles.map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05, y: -4 }}
              transition={{ type: "spring", stiffness: 200 }}
              className={`cursor-pointer border rounded-2xl p-6 shadow-md ${item.variant}`}
              onClick={() => router.push(item.href)}
            >
              <div className="flex items-center gap-3">
                <item.icon size={30} />
                <h2 className="text-xl font-bold">{item.title}</h2>
              </div>
              <p className="mt-3 text-sm opacity-80">{item.desc}</p>
              <div className="mt-4 font-semibold opacity-90 underline">
                Kelola →
              </div>
            </motion.div>
          ))}
        </div>

        <footer className="text-center mt-16 text-sm text-gray-400">
          © 2025 Form Service — Admin Panel
        </footer>
      </div>
    </>
  );
}

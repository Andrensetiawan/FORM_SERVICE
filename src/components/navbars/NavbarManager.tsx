"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Users,
  ClipboardList,
  FileBarChart,
  FileText,
  Wrench,
  LogOut,
} from "lucide-react";
import toast from "react-hot-toast";
import { ROLES } from "@/lib/roles";
import useAuth from "@/hooks/useAuth";

export default function NavbarManagement({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const { user, role, logout } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);

  // ❗ FIX TERPENTING: AUTO CLOSE SIDEBAR SAAT PINDAH HALAMAN
  useEffect(() => {
    if (menuOpen) setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const menuItems = [
    ...(role === ROLES.MANAGER || role === ROLES.OWNER || role === ROLES.ADMIN
      ? [
          {
            name: "Pending Approval",
            icon: <Users size={18} />,
            href: "/manager/pending-users",
          },
        ]
      : []),

    { name: "Daftar Staff", icon: <ClipboardList size={18} />, href: "/manager/staff" },
    { name: "Laporan", icon: <FileBarChart size={18} />, href: "/manager/laporan" },
    { name: "Form Service", icon: <FileText size={18} />, href: "/formservice" },
    { name: "Status Service", icon: <Wrench size={18} />, href: "/manager" },
  ];

  return (
    <>
      {/* NAVBAR */}
      <nav className={`bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] border-b border-blue-500 shadow-md sticky top-0 z-[50] ${className}`}>
        <div className="w-full flex items-center justify-between h-16 px-3 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="text-gray-200 hover:text-white transition"
            >
              <Menu size={26} />
            </button>

            <Link href="/manager" className="flex items-center gap-3 hover:opacity-90 transition">
              <Image
                src="/logo-ico.png"
                width={40}
                height={40}
                alt="Logo"
                className="rounded-full border border-blue-400 shadow-sm"
              />
              <span className="text-white font-semibold text-lg">Alif Cyber Solution</span>
            </Link>
          </div>

          {user && (
            <div className="relative flex items-center gap-2">
              <div className="relative">
                <Image
                  src={
                    user?.photoURL ||
                    "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  }
                  width={40}
                  height={40}
                  alt="User"
                  onClick={() => router.push(`/${user.uid}`)}
                  className="rounded-full border border-blue-500 cursor-pointer hover:scale-105 transition"
                  unoptimized
                />
                <span
                  className={`absolute -bottom-1 -right-1 text-[10px] font-semibold px-2 py-[2px] rounded-full ${
                    role === ROLES.OWNER
                      ? "bg-yellow-400 text-black"
                      : role === ROLES.MANAGER
                      ? "bg-blue-500 text-white"
                      : "bg-gray-500 text-white"
                  }`}
                >
                  {role?.[0]?.toUpperCase()}
                </span>
              </div>

              <div className="hidden md:flex flex-col text-right">
                                 <span className="text-gray-100 font-medium">
                                  {user?.displayName || "User"}                </span>
                <span className="text-xs text-blue-400 capitalize">{role}</span>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* SIDEBAR */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* BACKDROP — FIX: KECILKAN OPACITY DAN Z-INDEX */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black z-[40]"
            />

            {/* SIDEBAR PANEL */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="fixed top-0 left-0 h-full w-[260px] bg-[#0f172a] border-r border-blue-800 z-[50] flex flex-col shadow-xl"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-blue-800">
                <h2 className="text-white font-semibold text-lg">Navigasi</h2>
                <button onClick={() => setMenuOpen(false)} className="text-gray-200 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              {user && (
                <div className="flex flex-col items-center text-center px-6 py-6 border-b border-blue-800">
                  <img
                    src={
                      user.photoURL ||
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    }
                    className="w-24 h-24 rounded-full border-4 border-blue-400 object-cover shadow-lg mb-3"
                    alt="avatar"
                  />
                  <h2 className="text-white text-lg font-bold">{user.displayName}</h2>

                  <p
                    className={`mt-1 px-3 py-1 rounded-full text-sm font-semibold capitalize ${
                      role === ROLES.OWNER
                        ? "bg-yellow-100 text-yellow-700"
                        : role === ROLES.MANAGER
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {role}
                  </p>
                </div>
              )}

              {/* MENU */}
              <div className="flex-1 px-5 py-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        active
                          ? "bg-blue-600 text-white border-l-4 border-blue-400"
                          : "text-gray-200 hover:bg-blue-500"
                      }`}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="border-t border-blue-800 px-6 py-4 flex items-center justify-end">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-red-500/10 hover:bg-red-600/20 text-red-400 px-4 py-2 rounded-lg transition"
                >
                  Logout
                  <LogOut size={20} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

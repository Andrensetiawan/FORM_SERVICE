"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Users,
  Building2,
  Database,
  LogOut,
  Settings,
  BarChart3,
  Home,
  CircleUser,
  Trash2,
} from "lucide-react";
import { auth, db } from "@/lib/firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { ROLES } from "@/lib/roles";

export default function NavbarAdmin({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (u) {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUser({ ...u, ...snap.data() });
        } else {
          await setDoc(ref, {
            uid: u.uid,
            email: u.email,
            name: u.displayName || "User",
            role: ROLES.STAFF,
            photoURL: u.photoURL || "",
            approved: false,
            createdAt: new Date(),
          });
          setUser(u);
        }
      }
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const adminMenus = [
    { name: "Dashboard", icon: <Home size={18} />, href: "/admin" },
    { name: "Profile", icon: <CircleUser size={18} />, href: `/${user?.uid}` },
    { name: "Pending Approval", icon: <Home size={18} />, href: "/admin/pending-users" },
    {name: "Manajemen Cabang",icon: <Building2 size={18} />,href: "/admin/cabang",},
    { name: "Hapus TNS", icon: <Trash2 size={18} />, href: "/admin/hapus_tns" },
    { name: "Pengguna", icon: <Users size={18} />, href: "/admin/users" },
    { name: "Database", icon: <Database size={18} />, href: "/admin/database" },
    { name: "Audit Log", icon: <BarChart3 size={18} />, href: "/admin/logs" },
    { name: "Pengaturan", icon: <Settings size={18} />, href: "/admin/settings" },
  ];

  return (
    <>
      {/* 🔹 Navbar Atas */}
      <nav className={`bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] border-b border-blue-500 shadow-md fixed top-0 left-0 right-0 z-50 ${className}`}>
        <div className="w-full flex items-center justify-between h-16 px-3 md:px-6">

          {/* Tombol Menu + Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="text-gray-200 hover:text-white transition"
            >
              <Menu size={26} />
            </button>

            <Link
              href="/admin"
              className="flex items-center gap-3 hover:opacity-90 transition"
            >
              <Image
                src="/logo-ico.png"
                alt="Logo"
                width={40}
                height={40}
                className="rounded-full border border-blue-400 shadow-sm object-cover"
              />
              <span className="text-white font-semibold text-lg tracking-wide whitespace-nowrap">
                Admin Panel
              </span>
            </Link>
          </div>

          {/* Avatar */}
          {user && (
            <div className="relative flex items-center gap-2">
              <Image
                src={
                  user.photoURL ||
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                }
                alt="User"
                width={40}
                height={40}
                onClick={() => {
                  toast.loading("Membuka profil...");
                  setTimeout(() => {
                    router.push(`/${user?.uid}`);
                    toast.dismiss();
                  }, 400);
                }}
                className="rounded-full border border-blue-500 shadow-sm cursor-pointer hover:scale-105 hover:border-blue-400 transition-transform"
                unoptimized
              />

              <span className="absolute -bottom-1 -right-1 text-[10px] font-semibold px-2 py-[2px] rounded-full bg-yellow-400 text-black">
                A
              </span>
            </div>
          )}
        </div>
      </nav>

      {/* 🔹 Sidebar Animasi */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black z-[998]"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="fixed top-0 left-0 h-full w-[25%] min-w-[280px] bg-[#0f172a] border-r border-blue-800 z-[999] flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-blue-800">
                <h2 className="text-white font-semibold text-lg">Menu Admin</h2>
                <button onClick={() => setMenuOpen(false)} className="text-gray-200 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              {/* Profil */}
              {user && (
                <div className="flex flex-col items-center text-center px-6 py-6 border-b border-blue-800">
                  <img
                    src={
                      user?.photoURL ||
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    }
                    alt="Profile"
                    className="w-28 h-28 rounded-full border-4 border-blue-400 object-cover shadow-lg mb-3"
                  />
                  <h2 className="text-lg font-bold text-white">{user?.name}</h2>
                  <p className="mt-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-semibold">
                    Admin
                  </p>
                </div>
              )}

              {/* Menu */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
                {adminMenus.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        active
                          ? "bg-blue-600 text-white font-semibold border-l-4 border-blue-400"
                          : "text-gray-200 hover:bg-blue-500 hover:text-white"
                      }`}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Logout */}
              <div className="border-t border-blue-800 px-6 py-4 flex items-center justify-end">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-red-500/10 hover:bg-red-600/20 text-red-400 hover:text-red-500 px-4 py-2 rounded-lg transition"
                >
                  <span className="text-sm font-medium hidden md:inline">Logout</span>
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

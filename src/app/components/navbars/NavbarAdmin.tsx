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
  Shield,
  Home,
} from "lucide-react";
import { auth, db } from "@/lib/firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { ROLES } from "@/lib/roles";

export default function NavbarAdmin() {
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
    { name: "Dashboard", icon: <Home size={18} />, href: "/admin-dashboard" },
    { name: "Pengguna", icon: <Users size={18} />, href: "/admin-dashboard/users" },
    { name: "Cabang", icon: <Building2 size={18} />, href: "/admin-dashboard/cabang" },
    { name: "Database", icon: <Database size={18} />, href: "/admin-dashboard/database" },
    { name: "Audit Log", icon: <BarChart3 size={18} />, href: "/admin-dashboard/logs" },
    { name: "Pengaturan", icon: <Settings size={18} />, href: "/admin-dashboard/settings" },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* 🔹 Navbar Top - Fixed */}
      <nav className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 border-b border-blue-700/40 shadow-lg fixed top-0 left-0 right-0 z-50 backdrop-blur-lg">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          {/* Kiri: Menu + Logo */}
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setMenuOpen(true)}
              className="lg:hidden text-white hover:text-blue-100 transition p-1"
            >
              <Menu size={24} />
            </button>

            <Link
              href="/admin-dashboard"
              className="flex items-center gap-2 hover:opacity-90 transition"
            >
              <div className="flex items-center justify-center w-9 h-9 bg-blue-600 rounded-full border-2 border-blue-400">
                <Shield size={18} className="text-white" />
              </div>
              <span className="hidden sm:inline text-white font-bold text-base tracking-wide">
                Admin
              </span>
            </Link>
          </div>

          {/* Kanan: User Info + Logout */}
          {user && (
            <div className="relative flex items-center gap-2 md:gap-3">
              <Image
                src={user.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                alt="Avatar"
                width={40}
                height={40}
                className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-blue-300 object-cover"
              />
              <div className="hidden md:flex flex-col items-start">
                <p className="text-white font-semibold text-xs md:text-sm leading-tight">{user.name || user.email}</p>
                <p className="text-blue-100 text-xs uppercase">🛡️ {user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 hover:bg-blue-700 rounded-lg transition duration-200"
                title="Logout"
              >
                <LogOut size={18} className="text-white" />
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* 🔹 Sidebar Menu (Mobile Modal) */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed left-0 top-0 w-80 h-screen bg-gradient-to-b from-gray-900 to-gray-800 border-r border-blue-600/30 z-40 shadow-2xl overflow-y-auto pt-16"
            >
              {/* Header */}
              <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
                <span className="text-white font-bold text-lg">Menu Admin</span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="text-gray-300 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Menu Items */}
              <div className="p-4 space-y-2">
                {adminMenus.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      isActive(item.href)
                        ? "bg-blue-600 text-white font-semibold"
                        : "text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-700 my-4" />

              {/* Quick Links */}
              <div className="p-4 space-y-2">
                <p className="text-xs uppercase text-gray-500 font-semibold px-4">Quick Links</p>
                <Link
                  href="/management"
                  className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition"
                >
                  Management Dashboard
                </Link>
                <Link
                  href="/staff"
                  className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition"
                >
                  Staff View
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 🔹 Desktop Sidebar (hidden on mobile, visible on lg) */}
      <aside className="hidden lg:flex lg:fixed lg:left-0 lg:top-16 lg:w-64 lg:h-[calc(100vh-4rem)] lg:flex-col lg:bg-gradient-to-b lg:from-gray-900 lg:to-gray-800 lg:border-r lg:border-blue-600/30 lg:shadow-xl lg:z-40 lg:overflow-y-auto">
        <div className="w-full p-5 space-y-2 flex flex-col flex-1">
          {adminMenus.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition font-medium text-sm ${
                isActive(item.href)
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Divider */}
          <div className="border-t border-gray-700 my-3" />

          {/* Quick Links */}
          <p className="text-xs uppercase text-gray-500 font-semibold px-4 mt-2 mb-2">Quick Links</p>
          <Link
            href="/management"
            className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition text-xs font-medium"
          >
            📊 Management
          </Link>
          <Link
            href="/staff"
            className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition text-xs font-medium"
          >
            👥 Staff View
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-sm mt-3"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

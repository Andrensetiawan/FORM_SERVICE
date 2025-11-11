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
  ClipboardList,
  FileBarChart,
  FileText,
  Wrench,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { auth, db } from "@/lib/firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function NavbarManagement() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (u) {
        const docRef = doc(db, "users", u.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setUser({ ...u, ...snap.data() });
        } else {
          await setDoc(docRef, {
            uid: u.uid,
            email: u.email,
            name: u.displayName || "User",
            role: "staff",
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
    router.push("/login");
  };

  const menuItems = [
    { name: "Pending Approval", icon: <Users size={18} />, href: "/management/pending-users" },
    { name: "Daftar Staff", icon: <ClipboardList size={18} />, href: "/management/staff" },
    { name: "Laporan", icon: <FileBarChart size={18} />, href: "/management/laporan" },
    { name: "Form Service", icon: <FileText size={18} />, href: "/formservice" },
    { name: "Status Service", icon: <Wrench size={18} />, href: "/management" },
  ];

  return (
    <>
      {/* 🔹 Navbar Atas */}
      <nav className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] backdrop-blur-md border-b border-blue-500/40 sticky top-0 z-50">
        <div className="w-full flex items-center justify-between h-16 px-2 md:px-4">
  {/* Tombol Menu */}
  <div className="flex items-center gap-3">
    <button
      onClick={() => setMenuOpen(true)}
      className="text-gray-300 hover:text-white transition"
    >
      <Menu size={26} />
    </button>

    {/* Logo + Text */}
    <Link
      href="/management"
      className="flex items-center gap-2 md:gap-3 items-center hover:opacity-90 transition"
    >
      <Image
        src="/logo-ico.png"
        alt="Logo"
        width={40}
        height={40}
        className="rounded-full border border-blue-400 shadow-sm"
      />
      <span className="text-white font-semibold text-lg tracking-wide whitespace-nowrap">
        Alif Cyber Solution
      </span>
    </Link>
  </div>

  {/* Avatar kanan */}
  {user && (
    <div className="relative flex items-center gap-2 cursor-pointer">
      <div className="relative">
        <Image
          src={user?.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
          alt="User"
          width={40}
          height={40}
          className="rounded-full border border-blue-500 shadow-sm"
          unoptimized
        />
        <span
          className={`absolute -bottom-1 -right-1 text-[10px] font-semibold px-2 py-[2px] rounded-full ${
            user?.role === "owner"
              ? "bg-yellow-400 text-black"
              : user?.role === "manager"
              ? "bg-blue-500 text-white"
              : "bg-gray-500 text-white"
          }`}
        >
          {user?.role?.[0]?.toUpperCase()}
        </span>
      </div>

      <div className="hidden md:flex flex-col text-right">
        <span className="text-gray-200 font-medium">{user?.name || ""}</span>
        <span className="text-xs text-blue-400 capitalize">{user?.role}</span>
      </div>
    </div>
  )}
</div>

      </nav>

      {/* 🔹 Sidebar Slide dari Kiri */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Background Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black z-[998]"
            />

            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="fixed top-0 left-0 h-full w-[25%] min-w-[260px] bg-[#0f172a]/95 backdrop-blur-xl border-r border-blue-800 z-[999] flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-blue-800">
                <h2 className="text-white font-semibold text-lg">Navigasi</h2>
                <button onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              {/* Menu List */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {menuItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        active
                          ? "bg-blue-600/40 text-white font-semibold border-l-4 border-blue-400"
                          : "text-gray-300 hover:bg-blue-500/10 hover:text-white"
                      }`}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Footer User Info */}
              {user && (
                <div className="border-t border-blue-800 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Image
                      src={user?.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                      alt="Avatar"
                      width={40}
                      height={40}
                      className="rounded-full border border-blue-400 object-cover"
                      unoptimized
                    />
                    <div>
                      <p className="text-gray-200 font-medium">{user?.name}</p>
                      <p className="text-blue-400 text-sm capitalize">{user?.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-red-400 hover:text-red-500 transition"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

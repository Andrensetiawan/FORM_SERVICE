"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  LogOut,
  Home,
  FileText,
  Wrench,
  PhoneCall,
  Settings,
} from "lucide-react";
import { auth, db } from "@/lib/firebaseConfig";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import CustomizationPanel from "@/components/CustomizationPanel";

export default function NavbarStaff({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isCustomizationPanelOpen, setIsCustomizationPanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔹 Ambil data user dari Firebase Auth & Firestore
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const ref = doc(db, "users", u.uid);
          const snap = await getDoc(ref);

          if (snap.exists()) {
            setUser({ ...u, ...snap.data() });
          } else {
            // Jika belum ada dokumen user, buat baru
            await setDoc(ref, {
              uid: u.uid,
              email: u.email,
              name: u.displayName || "User",
              role: "staff",
              photoURL: u.photoURL || "",
              approved: false,
              createdAt: new Date(),
            });
            setUser({ ...u, role: "staff" });
          }
        } catch (err) {
          console.error("Gagal ambil data user:", err);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 🔹 Logout handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Berhasil logout!");
      router.push("/");
    } catch (err) {
      console.error("Logout gagal:", err);
      toast.error("Gagal logout");
    }
  };

  // 🔹 Menu navigasi staff

  const menuItems = [
    { name: "Home", icon: <Home size={18} />, href: "/staff" },
    { name: "Form Service", icon: <FileText size={18} />, href: "/formservice" },
    { name: "Contact", icon: <PhoneCall size={18} />, href: "/contact" },
  ];

  if (loading) return null; // Hindari flicker saat auth loading

  return (
    <>
      {/* === NAVBAR ATAS === */}
      <nav className={`bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] border-b border-blue-500 shadow-md sticky top-0 z-50 ${className}`}>
        <div className="w-full flex items-center justify-between h-16 px-3 md:px-6">
          {/* Kiri: Tombol Menu + Logo */}
          <div className="flex items-center gap-3">
            {user && (
              <button
                onClick={() => setMenuOpen(true)}
                className="text-gray-200 hover:text-white transition"
              >
                <Menu size={26} />
              </button>
            )}

            <Link
              href="/staff"
              className="flex items-center gap-3 hover:opacity-90 transition"
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

          {/* Kanan: Avatar User */}
          {user && (
            <div className="relative flex items-center gap-2">
              <div className="relative">
                <Image
                  src={
                    user?.photoURL ||
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
                <span className="absolute -bottom-1 -right-1 text-[10px] font-semibold px-2 py-[2px] rounded-full bg-blue-500 text-white">
                  S
                </span>
              </div>
              <div className="hidden md:flex flex-col text-right">
                <span className="text-gray-100 font-medium">{user?.name}</span>
                <span className="text-xs text-blue-400 capitalize">staff</span>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* === SIDEBAR ANIMATED === */}
      <AnimatePresence>
        {menuOpen && user && (
          <>
            {/* Overlay */}
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
              className="fixed top-0 left-0 h-full w-[25%] min-w-[280px] bg-[#0f172a] border-r border-blue-800 z-[999] flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-blue-800">
                <h2 className="text-white font-semibold text-lg">Navigasi</h2>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="text-gray-200 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Profil */}
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
                <p className="mt-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                  Staff
                </p>
              </div>

              {/* Menu */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
                {menuItems.map((item) => {
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
                {/* Customization Button */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setIsCustomizationPanelOpen(true);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-all text-gray-200 hover:bg-blue-500 hover:text-white"
                >
                  <Settings size={18} />
                  <span>Customization</span>
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-blue-800 px-6 py-4 flex items-center justify-end">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-red-500/10 hover:bg-red-600/20 text-red-400 hover:text-red-500 px-4 py-2 rounded-lg transition"
                >
                  <span className="text-sm font-medium hidden md:inline">
                    Logout
                  </span>
                  <LogOut size={20} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <CustomizationPanel
        isOpen={isCustomizationPanelOpen}
        onClose={() => setIsCustomizationPanelOpen(false)}
      />
    </>
  );
}

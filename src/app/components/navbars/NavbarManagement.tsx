"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  Users,
  ClipboardList,
  FileBarChart,
  FileText,
  Wrench,
  LogOut,
  Edit,
  ChevronDown,
} from "lucide-react";
import { signOut, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { motion, AnimatePresence } from "framer-motion";

export default function NavbarManagement() {
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // 🔥 Ambil data user dari Firestore
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (u) {
        const userDoc = await getDoc(doc(db, "users", u.uid));
        if (userDoc.exists()) {
          setUser({ ...u, ...userDoc.data() });
        } else {
          // Buat dokumen baru kalau belum ada
          await setDoc(doc(db, "users", u.uid), {
            uid: u.uid,
            email: u.email || "",
            name: u.displayName || "",
            role: "staff",
            approved: false,
            photoURL: u.photoURL || "",
            createdAt: new Date(),
          });
          setUser(u);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  // 💾 Simpan perubahan nama & avatar ke Auth + Firestore
  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;
    const userRef = doc(db, "users", auth.currentUser.uid);

    await updateProfile(auth.currentUser, {
      displayName: newName || auth.currentUser.displayName,
      photoURL: newAvatar || auth.currentUser.photoURL,
    });

    await updateDoc(userRef, {
      name: newName || auth.currentUser.displayName,
      photoURL: newAvatar || auth.currentUser.photoURL,
    });

    setUser({
      ...auth.currentUser,
      displayName: newName || auth.currentUser.displayName,
      photoURL: newAvatar || auth.currentUser.photoURL,
    });

    setEditModalOpen(false);
  };

  // 📤 Upload gambar ke Cloudinary
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log("📤 Uploading to Cloudinary...");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("❌ Response not ok:", errText);
        throw new Error("Upload gagal di server.");
      }

      const data = await res.json();
      console.log("✅ Response Cloudinary:", data);

      if (!data.secure_url) {
        throw new Error("Cloudinary tidak mengembalikan secure_url");
      }

      const downloadURL = data.secure_url;
      setNewAvatar(downloadURL);

      // ✅ Firestore aman: buat doc jika belum ada
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        await updateDoc(userRef, { photoURL: downloadURL });
      } else {
        await setDoc(userRef, {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email || "",
          name: auth.currentUser.displayName || "",
          role: "staff",
          approved: false,
          photoURL: downloadURL,
          createdAt: new Date(),
        });
      }

      await updateProfile(auth.currentUser, { photoURL: downloadURL });

      setUser((prev: any) => ({
        ...prev,
        photoURL: downloadURL,
      }));

      console.log("🎉 Avatar updated successfully!");
      alert("✅ Avatar berhasil diperbarui!");
    } catch (error: any) {
      console.error("🚨 Gagal upload Cloudinary:", error);
      alert(`Gagal upload ke Cloudinary: ${error.message}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const menuItems = [
    { name: "Pending Approval", icon: <Users size={18} />, href: "/management/pending-users" },
    { name: "Daftar Staff", icon: <ClipboardList size={18} />, href: "/management/staff" },
    { name: "Laporan", icon: <FileBarChart size={18} />, href: "/management/laporan" },
    { name: "Form Service", icon: <FileText size={18} />, href: "/formservice" },
    { name: "Status Service", icon: <Wrench size={18} />, href: "/management" },
  ];

  return (
    <nav className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] border-b border-blue-500/40 shadow-lg backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Brand */}
          <Link href="/management" className="flex items-center gap-3">
            <Image
              src="/logo-ico.png"
              alt="Logo"
              width={40}
              height={40}
              className="rounded-full border border-blue-400 shadow-sm"
            />
            <span className="text-white font-semibold text-lg sm:text-xl tracking-wide">
              Alif Cyber Solution
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {menuItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 text-sm font-medium transition-all ${
                    active
                      ? "text-blue-400 border-b-2 border-blue-400"
                      : "text-gray-300 hover:text-white hover:translate-y-[-1px]"
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Avatar + Dropdown */}
          <div className="hidden md:flex items-center gap-4 relative" ref={dropdownRef}>
            {user && (
              <div
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <Image
                  src={user?.photoURL || "https://via.placeholder.com/150"}
                  alt="User Avatar"
                  width={40}
                  height={40}
                  className="rounded-full border border-blue-400 shadow-sm group-hover:scale-105 transition-transform"
                  unoptimized
                />
                <div className="flex flex-col text-right">
                  <span className="text-gray-200 font-medium">{user.displayName || "Akun"}</span>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </div>
            )}

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-14 bg-[#1e293b] border border-blue-500/40 rounded-xl shadow-lg w-48 p-2 z-50"
                >
                  <button
                    onClick={() => {
                      setEditModalOpen(true);
                      setDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 w-full text-gray-200 hover:bg-blue-700/20 px-3 py-2 rounded-md"
                  >
                    <Edit size={16} />
                    Edit Profil
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full text-red-400 hover:bg-red-800/20 px-3 py-2 rounded-md"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Modal Edit Profile */}
      <AnimatePresence>
        {editModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999]"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-[#1e293b] p-6 rounded-xl shadow-xl border border-blue-700/40 w-96"
            >
              <h2 className="text-lg font-semibold text-white mb-4">Edit Profil</h2>

              <div className="space-y-4">
                {/* Nama */}
                <div>
                  <label className="text-gray-300 text-sm">Nama Lengkap</label>
                  <input
                    type="text"
                    className="w-full mt-1 px-3 py-2 bg-[#0f172a] text-white rounded-lg border border-blue-700/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={user?.displayName || "Nama"}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>

                {/* Upload Foto */}
                <div>
                  <label className="text-gray-300 text-sm">Foto Profil</label>
                  <div className="mt-2 flex flex-col items-start gap-3">
                    <Image
                      src={newAvatar || user?.photoURL || "https://via.placeholder.com/150"}
                      alt="Preview"
                      width={60}
                      height={60}
                      className="rounded-full border border-blue-500 object-cover"
                      unoptimized
                    />
                    <input
                      id="avatarUpload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <button
                      onClick={() => document.getElementById("avatarUpload")?.click()}
                      disabled={uploading}
                      className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm disabled:opacity-60"
                    >
                      {uploading ? "Mengunggah..." : "Pilih Foto"}
                    </button>
                    {uploading && (
                      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tombol Simpan */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

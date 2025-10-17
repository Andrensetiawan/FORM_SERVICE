"use client";

import Image from "next/image";
import { useState } from "react";
import { Menu, X, LogOut, Home, PhoneCall, Wrench } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  return (
    <nav className="bg-gradient-to-r from-blue-700 via-indigo-800 to-gray-900 shadow-lg sticky top-0 z-50 w-full border-b border-blue-500/30 backdrop-blur-lg bg-opacity-80">
      <div className="w-full px-5 sm:px-8 lg:px-10">
        <div className="flex justify-between items-center h-16">
          {/* 🪪 Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer">
            <Image
              src="/logo-ico.png"
              alt="Logo"
              width={42}
              height={42}
              className="rounded-full border border-blue-400 shadow-md"
            />
            <span className="text-white text-xl font-semibold tracking-wide hover:text-blue-200 transition">
              Alif Cyber Solution
            </span>
          </div>

          {/* 🌐 Menu Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="https://alifcybersolution.my.id/" className="flex items-center text-gray-200 hover:text-white transition">
              <Home size={18} className="mr-1" /> Home
            </a>
            <a href="#" className="flex items-center text-gray-200 hover:text-white transition">
              <Wrench size={18} className="mr-1" /> Status Service
            </a>
            <a href="#" className="flex items-center text-gray-200 hover:text-white transition">
              <PhoneCall size={18} className="mr-1" /> Contact
            </a>
          </div>

          {/* 📞 Kontak & Tombol Logout */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="text-sm text-gray-300 text-right leading-tight">
              <p className="font-medium">0813 1566 2763</p>
              <a
                href="mailto:alifcybersolution@gmail.com"
                className="hover:text-white transition"
              >
                alifcybersolution@gmail.com
              </a>
            </div>

            {/* 🔘 Tombol Logout Elegan */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg shadow-md hover:from-red-500 hover:to-red-600 transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              <LogOut size={18} />
              <span className="font-medium">Logout</span>
            </button>
          </div>

          {/* 📱 Tombol Mobile Menu */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-200 hover:text-white focus:outline-none transition"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* 📲 Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-gradient-to-b from-blue-800 via-blue-900 to-black w-full px-5 py-4 space-y-3 border-t border-blue-600/40">
          <a href="#" className="flex items-center text-gray-200 hover:text-white transition">
            <Home size={18} className="mr-2" /> Home
          </a>
          <a href="#" className="flex items-center text-gray-200 hover:text-white transition">
            <Wrench size={18} className="mr-2" /> Status Service
          </a>
          <a href="#" className="flex items-center text-gray-200 hover:text-white transition">
            <PhoneCall size={18} className="mr-2" /> Contact
          </a>

          {/* 🔘 Logout Mobile */}
          <button
            onClick={handleLogout}
            className="mt-4 w-full flex items-center justify-center bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white py-2.5 rounded-lg shadow-md font-medium transition-all duration-300"
          >
            <LogOut size={18} className="mr-2" /> Logout
          </button>

          <div className="pt-3 border-t border-blue-700/50 text-gray-300 text-sm">
            <p>📞 0813 1566 2763</p>
            <a
              href="mailto:admin@hibatillahcyber.com"
              className="hover:text-white transition"
            >
            alifcybersolution@gmail.com
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

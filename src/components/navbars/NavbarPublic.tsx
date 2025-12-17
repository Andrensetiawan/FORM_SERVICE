"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Home, Wrench, FileText, PhoneCall } from "lucide-react";

export default function NavbarPublic({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { name: "Home", icon: <Home size={18} />, href: "https://alifcybersolution.my.id/" },
    { name: "Status Service", icon: <Wrench size={18} />, href: "/status" },
    { name: "Contact", icon: <PhoneCall size={18} />, href: "https://alifcybersolution.my.id/contact/" },
  ];

  return (
    <nav className={`bg-gradient-to-r from-blue-700 via-indigo-800 to-gray-900 border-b border-blue-500 shadow-md sticky top-0 z-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* === Brand === */}
          <Link href="https://alifcybersolution.my.id" className="flex items-center gap-3">
            <Image
              src="/logo-ico.png"
              alt="Logo"
              width={42}
              height={42}
              className="rounded-full border border-blue-400 shadow-sm"
            />
            <span className="text-white font-semibold text-lg sm:text-xl tracking-wide">
              Alif Cyber Solution
            </span>
          </Link>

          {/* === Desktop Menu === */}
          <div className="hidden md:flex items-center gap-8">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-1 text-sm font-medium transition-all ${
                  pathname === item.href
                    ? "text-white border-b-2 border-blue-400"
                    : "text-gray-100 hover:text-white"
                }`}
              >
                {item.icon} {item.name}
              </Link>
            ))}
          </div>

          {/* === Kontak (kanan) === */}
          <div className="hidden md:flex items-center gap-6">
            <div className="text-sm text-gray-100 text-right">
              <p className="font-medium">📞 0813 1566 2763</p>
              <a
                href="mailto:alifcybersolution@gmail.com"
                className="hover:text-white transition"
              >
                alifcybersolution@gmail.com
              </a>
            </div>
          </div>

          {/* === Mobile Toggle === */}
          <button
            className="md:hidden text-gray-100 hover:text-white transition"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* === Mobile Menu === */}
      {isOpen && (
        <div className="md:hidden bg-gradient-to-b from-blue-800 via-blue-900 to-black border-t border-blue-700/40">
          <div className="px-6 py-4 space-y-3">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2 text-gray-100 hover:text-white transition ${
                  pathname === item.href ? "text-white font-semibold" : ""
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}

            <div className="pt-3 border-t border-blue-700 text-gray-200 text-sm">
              <p>📞 0813 1566 2763</p>
              <a
                href="mailto:alifcybersolution@gmail.com"
                className="hover:text-white transition"
              >
                alifcybersolution@gmail.com
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

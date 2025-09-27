"use client";

import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-blue-700 via-blue-800 to-black shadow-lg sticky top-0 z-50 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Image
              src="/logo-hibatillah-ico.png"
              alt="Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="text-white text-lg font-bold">Hibatillah Cyber</span>
          </div>

          {/* Menu Desktop */}
          <div className="hidden md:flex space-x-6">
            <a href="#" className="text-gray-200 hover:text-white transition">
              Home
            </a>
            <a href="#" className="text-gray-200 hover:text-white transition">
              Services
            </a>
            <a href="#" className="text-gray-200 hover:text-white transition">
              Contact
            </a>
          </div>

          {/* Contact / Right Info */}
          <div className="hidden md:flex flex-col items-end text-right text-sm text-gray-200">
            <span>0813 1566 2763</span>
            <a
              href="mailto:admin@hibatillahcyber.com"
              className="hover:text-white"
            >
              admin@hibatillahcyber.com
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-200 hover:text-white focus:outline-none"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-blue-900 w-full px-4 py-3 space-y-2">
          <a href="#" className="block text-gray-200 hover:text-white">
            Home
          </a>
          <a href="#" className="block text-gray-200 hover:text-white">
            Services
          </a>
          <a href="#" className="block text-gray-200 hover:text-white">
            Contact
          </a>
          <div className="pt-2 border-t border-blue-700">
            <span className="block text-gray-200">0813 1566 2763</span>
            <a
              href="mailto:admin@hibatillahcyber.com"
              className="block text-gray-200 hover:text-white"
            >
              admin@hibatillahcyber.com
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

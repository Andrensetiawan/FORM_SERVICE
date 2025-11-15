"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import NavbarSwitcher from "@/app/components/navbars/NavbarSwitcher";

export default function WOSearchPage() {
  const [trackNumber, setTrackNumber] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // simulasi daftar TNS yang tersedia (nanti bisa diganti fetch ke Firestore)
    const availableTNS = ["TNS1", "TNS2", "TNS3"];

    if (availableTNS.includes(trackNumber.trim().toUpperCase())) {
      router.push(`/wo/${trackNumber.trim().toUpperCase()}`);
    } else {
      setError("⚠️ Nomor TNS tidak ditemukan. Pastikan nomor benar!");
    }
  };

  return (
    <div>
      <NavbarSwitcher/>
    
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex flex-col items-center justify-center px-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md text-center border border-gray-200">
        <div className="flex justify-center mb-4">
          <Image src="/logo-ico.png" alt="Logo" width={60} height={60} />
        </div>
        <h1 className="text-2xl font-bold text-blue-800 mb-2">Status Traking Number Service</h1>
        <p className="text-gray-600 text-sm mb-6">
          Masukkan nomor TNS untuk melihat status servis Anda.
        </p>

        <form onSubmit={handleSearch} className="space-y-4">
          <input
            type="text"
            value={trackNumber}
            onChange={(e) => setTrackNumber(e.target.value)}
            placeholder="Contoh: TNS1"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg font-semibold shadow-md transition"
          >
            Cek Status
          </button>
        </form>

        {error && (
          <p className="mt-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-2">
            {error}
          </p>
        )}
      </div>

      <p className="mt-6 text-xs text-gray-400">
        © {new Date().getFullYear()} Alif Cyber Solution
      </p>
    </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchTNSPage() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function performSearch() {
    if (!query.trim()) {
      setError("Mohon masukkan nomor telepon atau kode TNS.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/find-tns?query=${encodeURIComponent(query.trim())}`);

      if (res.ok) {
        const data = await res.json();
        if (data?.id) {
            router.push(`/tns/${data.id}`);
        } else {
            setError("Data ID tidak ditemukan dalam respons server.");
        }
        setLoading(false);
        return; 
      }

      // Handle server error response
      const errorData = await res.json();
      if (errorData.error === 'Internal Server Error - Detailed') {
          const detailedError = `Message: ${errorData.message}\n\nStack:\n${(errorData.stack || []).join('\n')}`;
          setError(detailedError);
      } else {
          setError(errorData.message || "Data tidak ditemukan.");
      }

    } catch(err) {
      setError("Terjadi kesalahan koneksi. Tidak dapat menghubungi server.");
    } finally {
        setLoading(false);
    }
  }

  return (
    <main className="flex flex-col items-center justify-start min-h-screen bg-gray-50 pt-20 px-4">

      {/* TITLE */}
      <h1 className="text-4xl font-extrabold text-gray-800 mb-8">
        Pencarian TNS
      </h1>

      {/* SEARCH BAR */}
      <div className="w-full max-w-2xl relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && performSearch()}
          placeholder="TNS-xxxx atau Nomor Telepon"
          className="w-full p-4 pl-6 pr-14 text-lg bg-white border border-gray-200 text-gray-800 shadow-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 antialiased"
        />

        <button
          onClick={performSearch}
          disabled={loading}
          className="absolute right-1 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-md transition disabled:opacity-50"
        >
          {/* Search Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </div>

      {/* DESCRIPTION */}
      <p className="text-gray-700 mt-10 text-center text-lg max-w-xl">
        Mulai pencarian Anda. Saya akan menemukan informasi terbaru
        untuk Anda!
      </p>
      
      {/* ERROR MESSAGE */}
      {error && (
        <div className="w-full max-w-2xl text-left mt-6 bg-red-50 p-4 rounded-xl border border-red-200 shadow-md">
            <p className="font-bold text-lg text-red-800 mb-2">Terjadi Error di Server</p>
            <pre className="whitespace-pre-wrap text-sm text-red-700 font-mono bg-red-100 p-3 rounded-lg overflow-x-auto">
                {error}
            </pre>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="flex items-center gap-3 mt-6">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="text-gray-600 text-lg">Mencari...</span>
        </div>
      )}
    </main>
  );
}

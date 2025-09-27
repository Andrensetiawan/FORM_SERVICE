"use client";

import InputField from "@/components/inputfield";
import FormSection from "@/components/formsection";
import Navbar from "@/components/navbar";
import { useState } from "react";

export default function Home() {
  const [accessories, setAccessories] = useState<string[]>(["Baterai", "Adaptor"]);

  const handleCheckbox = (item: string) => {
    setAccessories((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = {
      nama: "John Doe", // ini nanti ganti ambil dari state input
      alamat: "Jl. Sudirman",
      no_hp: "08123456789",
      email: "john@example.com",
    };

    const res = await fetch("/api/service", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const result = await res.json();
    console.log("Respon API:", result);
    alert(result.message);
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Navbar */}
      <Navbar />

      {/* Main */}
      <main className="max-w-4xl w-full mx-auto p-6 space-y-6">
        <div className="text-center text-black">
          <h1 className="text-2xl font-bold">Selamat datang di Layanan Service Kami</h1>
          <p>Cepat, Mudah, dan Terpercaya!</p>
        </div>

        {/* FORM (satu saja, jangan dobel) */}
        <form className="space-y-6 text-black" onSubmit={handleSubmit}>
          {/* Data Customer */}
          <FormSection title="Data Customer">
            <InputField label="Nama" placeholder="Nama" />
            <InputField label="Alamat" placeholder="Alamat" textarea />
            <InputField label="No. Handphone" placeholder="No. Handphone" />
            <InputField label="Email" placeholder="Email" />
          </FormSection>

          {/* Data Barang */}
          <FormSection title="Data Barang">
            <InputField label="Merk" placeholder="Merk" />
            <InputField label="Tipe" placeholder="Tipe" />
            <InputField label="Serial Number" placeholder="Serial Number" />
            <InputField label="Keluhan" placeholder="Keluhan" textarea />
            <InputField label="Spesifikasi Teknis" placeholder="Spesifikasi Teknis" textarea />
          </FormSection>

          {/* Jenis Perangkat */}
          <FormSection title="Jenis Perangkat">
            <div className="flex flex-wrap gap-4">
              {["Laptop", "PC", "UPS", "Console"].map((device) => (
                <label key={device} className="flex items-center space-x-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span>{device}</span>
                </label>
              ))}
            </div>
          </FormSection>

          {/* Accessories */}
          <FormSection title="Accessories">
            <div className="flex flex-wrap gap-4">
              {["Baterai", "Adaptor", "Tas", "Casing", "Mouse", "Receiver"].map(
                (acc) => (
                  <label key={acc} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={accessories.includes(acc)}
                      onChange={() => handleCheckbox(acc)}
                      className="w-4 h-4"
                    />
                    <span>{acc}</span>
                  </label>
                )
              )}
            </div>
          </FormSection>

          {/* Garansi */}
          <FormSection title="Garansi">
            <div className="flex space-x-6">
              <label className="flex items-center space-x-2">
                <input type="radio" name="garansi" className="w-4 h-4" />
                <span>Ya</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" name="garansi" className="w-4 h-4" />
                <span>Tidak</span>
              </label>
            </div>
            <InputField label="Keterangan Garansi" placeholder="Keterangan" />
          </FormSection>

          {/* Kondisi */}
          <FormSection title="Kondisi Saat Masuk">
            <div className="grid grid-cols-2 gap-3">
              {[
                "Mati Total", "Layar Gelap", "Layar Biru", "Bekas Jatuh",
                "Chasing Pecah", "Pernah Dibongkar", "Baret", "Retak",
                "Kotor / Berdebu",
              ].map((condition) => (
                <label key={condition} className="flex items-center space-x-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span>{condition}</span>
                </label>
              ))}
            </div>
          </FormSection>

          {/* Info Tambahan */}
          <FormSection title="Info Tambahan">
            <InputField label="Prioritas Service" placeholder="1. Reguler" />
            <InputField label="Track Number" placeholder="Track Number" />
            <InputField label="Penerima Service" placeholder="Penerima Service" />
          </FormSection>

          {/* Submit */}
          <div className="flex space-x-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700"
            >
              Submit Only
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

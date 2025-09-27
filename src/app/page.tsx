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

  return (
    // Gunakan <div> sebagai pembungkus utama seluruh halaman
    // Anda bisa tambahkan warna latar di sini, misal: className="bg-gray-50"
    <div >
      {/* 1. Navbar sekarang berada di luar container pembatas lebar */}
      <Navbar  />

      {/* 2. Tag <main> sekarang membungkus konten utama DAN menjadi container yang terpusat */}
      <main className="max-w-4xl w-full mx-auto p-6 space-y-6 ">
        <div className="text-center">
            <h1 className="text-2xl font-bold">Selamat Datang</h1>
            <p>Ini halaman utama dengan navbar biru & hitam.</p>
        </div>
        
        <form className=" space-y-6">
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
            <InputField label="Cabang" placeholder="Pilih Cabang" />
            <InputField label="Sales" placeholder="Sales" />
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
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md shadow hover:bg-blue-600"
            >
              Submit & Duplicate
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
"use client";

import React from "react";

// Updated interface to include all required fields
interface NotaData {
  nomorNota: string;
  namaCustomer: string;
  noHp: string;
  email: string;
  alamat: string;
  tglTerima: string;
  penerimaService: string;
  prioritasService: string;

  merk: string;
  tipe: string;
  serialNumber: string;
  keluhan: string;
  kondisi: string; // Changed from kondisiTerakhir
  perlengkapan: string;
  spesifikasiTambahan: string;
  garansi: string;

  tindakanService: { item: string; qty: number; jumlah: number }[];
  biaya: number;
  uangMuka: number;
  sisaPembayaran: number;
  discount: number;
  total: number;
}

interface NotaPembayaranProps {
  data: NotaData;
}

// Helper component for key-value pairs
const KeyValue = ({ label, value }: { label: string; value: string | undefined }) => (
    <tr>
        <td className="p-1 pr-2 font-semibold w-[150px]">{label}</td>
        <td className="p-1 pr-2">:</td>
        <td className="p-1">{value || '-'}</td>
    </tr>
);


import useAuth from "@/hooks/useAuth";

export default function NotaPembayaran({ data }: NotaPembayaranProps) {
  const { user } = useAuth();
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-200 p-6 print:bg-white">
      <div className="mx-auto w-full max-w-4xl">
        <div className="relative mx-auto w-[1000px] bg-white border-2 border-black" id="print-area">
          {/* SIDE DECORATION - NOW VISIBLE ON PRINT */}
          <div className="absolute -left-[60px] top-0 bottom-0 w-[55px] bg-yellow-400 flex items-center justify-center print-colors">
            <div className="writing-vertical rotate-180 font-bold tracking-wide text-sm">
              BUKTI PEMBAYARAN
            </div>
          </div>
          <div className="absolute -right-[60px] top-0 bottom-0 w-[55px] bg-yellow-400 flex items-center justify-center print-colors">
            <div className="writing-vertical font-bold tracking-wide text-sm">
              BUKTI PEMBAYARAN
            </div>
          </div>

          {/* HEADER */}
          <div className="grid grid-cols-[220px_1fr_260px] border-b-2 border-black">
            <div className="bg-blue-600 text-white font-bold text-center p-3 print-colors">
              NOMOR NOTA SERVICE
              <br />
              {data.nomorNota}
            </div>
            <div className="text-center p-3">
              <h2 className="text-xl font-bold tracking-wide">BUKTI TANDA TERIMA SERVICE</h2>
              <div className="font-bold">ALIF CYBER</div>
              <div className="text-xs text-gray-700">Service · Networking · Consultation</div>
            </div>
            <div className="bg-blue-600 text-white font-bold p-3 text-sm print-colors">
              Alamat:<br />Jl. Cabe V No.5B, Pamulang
              <br />
              📞 081315662763
            </div>
          </div>

          {/* CUSTOMER & DEVICE INFO */}
          <div className="grid grid-cols-2 gap-x-4 border-b-2 border-black text-xs p-3">
            {/* CUSTOMER DATA */}
            <div className="border-r-2 border-black pr-3">
                <h3 className="font-bold text-sm mb-2">Data Customer</h3>
                <table className="w-full">
                    <tbody>
                        <KeyValue label="Nama" value={data.namaCustomer} />
                        <KeyValue label="No HP" value={data.noHp} />
                        <KeyValue label="Email" value={data.email} />
                        <KeyValue label="Alamat" value={data.alamat} />
                        <KeyValue label="Tanggal Masuk" value={data.tglTerima} />
                        <KeyValue label="Penerima Service" value={data.penerimaService} />
                        <KeyValue label="Prioritas Service" value={data.prioritasService} />
                    </tbody>
                </table>
            </div>

            {/* DEVICE DATA */}
            <div>
                <h3 className="font-bold text-sm mb-2">Data Perangkat</h3>
                <table className="w-full">
                    <tbody>
                        <KeyValue label="Merk" value={data.merk} />
                        <KeyValue label="Tipe" value={data.tipe} />
                        <KeyValue label="Serial Number" value={data.serialNumber} />
                        <KeyValue label="Keluhan" value={data.keluhan} />
                        <KeyValue label="Kondisi" value={data.kondisi} />
                        <KeyValue label="Perlengkapan" value={data.perlengkapan} />
                        <KeyValue label="Spesifikasi Tambahan" value={data.spesifikasiTambahan} />
                        <KeyValue label="Garansi" value={data.garansi} />
                    </tbody>
                </table>
            </div>
          </div>

          {/* DISCLAIMER */}
          <div className="border-b-2 border-black p-3 text-xs leading-relaxed">
            <strong className="font-bold">Pernyataan Persetujuan Layanan Perbaikan (Disclaimer)</strong>
            <ol className="list-decimal pl-4 mt-1 space-y-px">
              <li>Penyedia layanan berusaha memperbaiki sesuai kemampuan.</li>
              <li>Perubahan kondisi kerusakan dapat terjadi.</li>
              <li>Estimasi dan biaya dikonfirmasi terlebih dahulu.</li>
              <li>Pembatalan sepihak tidak diperbolehkan.</li>
              <li>Barang tidak diambil 30 hari bukan tanggung jawab kami.</li>
              <li>Data & dokumen tanggung jawab pelanggan.</li>
              <li>Risiko kehilangan data bukan tanggung jawab kami.</li>
              <li>Cancel fee Rp50.000 – Rp100.000.</li>
              <li>Garansi sesuai kesepakatan.</li>
            </ol>
          </div>

          {/* SERVICE TABLE */}
          <table className="w-full border-collapse text-xs">
            {/* table content remains the same */}
            <thead>
              <tr>
                <th className="border border-gray-700 p-2 text-left">Tindakan Service / Sparepart</th>
                <th className="border border-gray-700 p-2 w-[60px]">QTY</th>
                <th className="border border-gray-700 p-2 w-[150px]">Jumlah (IDR)</th>
              </tr>
            </thead>
            <tbody>
              {data.tindakanService.map((tindakan, i) => (
                <tr key={i}>
                  <td className="border border-gray-700 h-[30px] p-2">{tindakan.item}</td>
                  <td className="border border-gray-700 p-2 text-center">{tindakan.qty}</td>
                  <td className="border border-gray-700 p-2 text-right">{tindakan.jumlah.toLocaleString()}</td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 3 - data.tindakanService.length) }).map((_, i) => (
                <tr key={`empty-${i}`}><td className="border border-gray-700 h-[30px]"></td><td className="border border-gray-700"></td><td className="border border-gray-700"></td></tr>
              ))}
              <tr><td className="border border-gray-700 p-2">Biaya</td><td colSpan={2} className="border border-gray-700 p-2 text-right">{data.biaya.toLocaleString()}</td></tr>
              <tr><td className="border border-gray-700 p-2">Uang Muka</td><td colSpan={2} className="border border-gray-700 p-2 text-right">{data.uangMuka.toLocaleString()}</td></tr>
              <tr><td className="border border-gray-700 p-2">Sisa Pembayaran</td><td colSpan={2} className="border border-gray-700 p-2 text-right">{data.sisaPembayaran.toLocaleString()}</td></tr>
              <tr><td className="border border-gray-700 p-2">Discount %</td><td colSpan={2} className="border border-gray-700 p-2 text-right">{data.discount}%</td></tr>
              <tr><th className="border border-gray-700 p-2">TOTAL</th><th colSpan={2} className="border border-gray-700 p-2 text-right">{data.total.toLocaleString()}</th></tr>
            </tbody>
          </table>

          {/* FOOTER */}
          <div className="grid grid-cols-3 text-center text-xs p-6 gap-4">
            {["Mengetahui Pelanggan", "Barang Sudah Diambil", "Penyedia Layanan"].map((label) => (
              <div key={label}>{label}<div className="border-t border-gray-700 mt-24 mb-1" />Nama jelas & ttd</div>
            ))}
          </div>
        </div>
        <div className="text-center mt-4 no-print">
            <button
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                Print Nota
            </button>
        </div>
      </div>
    </div>
  );
}

"use client";

type Props = {
  serviceData: any;
  formatDateTime: (ts: any) => string;
};

export default function CustomerDeviceInfo({ serviceData, formatDateTime }: Props) {
  return (
    <section className="grid md:grid-cols-2 gap-4">
      {/* Data Customer */}
      <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-4 space-y-2">
        <h2 className="font-semibold text-lg mb-3 text-white">🧍 Data Customer</h2>
        <p><span className="text-gray-400">Nama:</span> {serviceData.nama || "-"}</p>
        <p><span className="text-gray-400">No HP:</span> {serviceData.no_hp || "-"}</p>
        <p><span className="text-gray-400">Email:</span> {serviceData.email || "-"}</p>
        <p><span className="text-gray-400">Alamat:</span> {serviceData.alamat || "-"}</p>
        <p><span className="text-gray-400">Penerima Service:</span> {serviceData.penerima_service || "-"}</p>
        <p><span className="text-gray-400">Tanggal Masuk:</span> {formatDateTime(serviceData.timestamp)}</p>
      </div>

      {/* Data Perangkat */}
      <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-4 space-y-2">
        <h2 className="font-semibold text-lg mb-3 text-white">💻 Data Perangkat</h2>
        <p><span className="text-gray-400">Merk:</span> {serviceData.merk || "-"}</p>
        <p><span className="text-gray-400">Tipe:</span> {serviceData.tipe || "-"}</p>
        <p><span className="text-gray-400">Serial Number:</span> {serviceData.serial_number || "-"}</p>
        <p><span className="text-gray-400">Keluhan:</span> {serviceData.keluhan || "-"}</p>

        <p><span className="text-gray-400">Kondisi:</span> {(serviceData.kondisi || []).join(", ") || "-"}</p>
        <p><span className="text-gray-400">Spesifikasi:</span> {serviceData.spesifikasi_teknis || "-"}</p>
        <p><span className="text-gray-400">Garansi:</span>
          {" "}{serviceData.garansi ? "Ya" : "Tidak"}
        </p>
      </div>
    </section>
  );
}

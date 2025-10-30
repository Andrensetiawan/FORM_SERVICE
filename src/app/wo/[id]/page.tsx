"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import Image from "next/image";
import Navbar from "@/app/components/navbar";

export default function trakingnumberserviceDetail() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "Traking_Number_Service", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setData(docSnap.data());
        } else {
          setData(null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600 text-lg">
        Memuat data Traking Number Service...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center text-red-600">
        <p className="text-2xl font-semibold mb-3">❌ Data TNS Tidak Ditemukan</p>
        <p>Periksa kembali nomor Traking Number Service yang kamu masukkan.</p>
      </div>
    );
  }

  return (
    <div>
    <Navbar/>
    <main className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Traking Number Service #{id}</h1>
          <p className="text-sm text-blue-100">Status: {data.status || "Dalam Proses"}</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-8">

          {/* Data Customer */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
              🧑 Data Customer
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Detail label="Nama" value={data.nama} />
              <Detail label="No HP" value={data.no_hp} />
              <Detail label="Email" value={data.email} />
              <Detail label="Alamat" value={data.alamat} />
            </div>
          </section>

          {/* Data Perangkat */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
              💻 Data Perangkat
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Detail label="Merk" value={data.merk} />
              <Detail label="Tipe" value={data.tipe} />
              <Detail label="Serial Number" value={data.serial_number} />
              <Detail label="Jenis Perangkat" value={(data.jenis_perangkat || []).join(", ")} />
              <Detail label="Keterangan Perangkat" value={data.keterangan_perangkat} />
              <Detail label="Aksesoris" value={(data.accessories || []).join(", ")} />
              <Detail label="Keterangan Aksesoris" value={data.keterangan_accessories} />
              <Detail label="Kondisi Awal" value={(data.kondisi || []).join(", ")} />
              <Detail label="Keterangan Kondisi" value={data.keterangan_kondisi} />
              <Detail label="Spesifikasi Teknis" value={data.spesifikasi_teknis} />
              <Detail label="Garansi" value={data.garansi ? "✅ Ya" : "❌ Tidak"} />
              <Detail label="Keterangan Garansi" value={data.keterangan_garansi} />
            </div>
          </section>

          {/* Keluhan dan Catatan */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
              🧾 Keluhan & Catatan
            </h2>
            <Detail label="Keluhan" value={data.keluhan} />
            <Detail label="Komentar Teknisi" value={data.komentar || "-"} />
          </section>

          {/* Info Service */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
              🧰 Informasi Service
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Detail label="Prioritas" value={data.prioritas_service} />
              <Detail label="Teknisi" value={data.teknisi || "-"} />
              <Detail label="Estimasi Selesai" value={data.estimasi || "-"} />
              <Detail label="Track Number" value={data.track_number || "-"} />
              <Detail label="Penerima Service" value={data.penerima_service} />
            </div>
          </section>

          {/* Foto */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
              📸 Dokumentasi
            </h2>
            <div className="flex flex-wrap gap-6">
              {data.foto_customer && (
                <Image
                  src={data.foto_customer}
                  alt="Foto Customer"
                  width={220}
                  height={220}
                  className="rounded-xl shadow-md border"
                />
              )}
              {data.foto_penerimaan && (
                <Image
                  src={data.foto_penerimaan}
                  alt="Foto Penerimaan"
                  width={220}
                  height={220}
                  className="rounded-xl shadow-md border"
                />
              )}
              {data.foto_pengambilan && (
                <Image
                  src={data.foto_pengambilan}
                  alt="Foto Pengambilan"
                  width={220}
                  height={220}
                  className="rounded-xl shadow-md border"
                />
              )}
            </div>
          </section>

          {/* Tanda Tangan */}
          {data.tanda_tangan && (
            <section>
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                ✍️ Tanda Tangan Customer
              </h2>
              <Image
                src={data.tanda_tangan}
                alt="Tanda Tangan"
                width={250}
                height={120}
                className="rounded-lg border shadow-sm"
              />
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-right text-sm text-gray-500 border-t">
          © {new Date().getFullYear()} Hibatillah Service Center – Data hanya untuk tampilan.
        </div>
      </div>
    </main>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="font-medium text-gray-800 border-b border-gray-100 pb-1">
        {value || "-"}
      </span>
    </div>
  );
  
}

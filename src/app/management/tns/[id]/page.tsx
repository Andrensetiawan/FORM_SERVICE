"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { motion } from "framer-motion";
import NavbarSwitcher from "@/app/components/navbars/NavbarSwitcher";
import { useRouter } from "next/navigation";

export default function DetailTNSManagementPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const snap = await getDoc(doc(db, "service_requests", id));
        if (snap.exists()) setData({ id: snap.id, ...snap.data() });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500 text-lg">
        Memuat data TNS...
      </div>
    );

  if (!data)
    return (
      <div className="flex justify-center items-center h-screen text-red-500 text-lg">
        Data TNS tidak ditemukan.
      </div>
    );

  return (
    <>
      <NavbarSwitcher />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-blue-700 text-white px-8 py-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                TNS #{data.track_number || data.id}
              </h1>
              <p className="text-sm text-blue-100">
                Terakhir diperbarui:{" "}
                {data.last_updated_at
                  ? new Date(data.last_updated_at.seconds * 1000).toLocaleString()
                  : "-"}
              </p>
            </div>
            <span
              className={`px-4 py-1.5 text-sm font-semibold rounded-full shadow-sm ${
                data.status === "Selesai"
                  ? "bg-green-500"
                  : data.status === "Proses"
                  ? "bg-yellow-500"
                  : "bg-gray-400"
              }`}
            >
              {data.status || "Belum Ditentukan"}
            </span>
          </div>

          {/* Body */}
          <div className="p-8 space-y-10">
            {/* 🔹 Data Customer */}
            <Section title="🧍 Data Customer">
              <DetailTable
                rows={[
                  { label: "Nama", value: data.nama },
                  { label: "No HP", value: data.no_hp },
                  { label: "Email", value: data.email },
                  { label: "Alamat", value: data.alamat },
                ]}
              />
            </Section>

            {/* 🔹 Data Perangkat */}
            <Section title="💻 Data Perangkat">
              <DetailTable
                rows={[
                  { label: "Merk", value: data.merk },
                  { label: "Tipe", value: data.tipe },
                  { label: "Serial Number", value: data.serial_number },
                  {
                    label: "Jenis Perangkat",
                    value: (data.jenis_perangkat || []).join(", "),
                  },
                  { label: "Keluhan", value: data.keluhan },
                  { label: "Spesifikasi Teknis", value: data.spesifikasi_teknis },
                  { label: "Garansi", value: data.garansi ? "✅ Ya" : "❌ Tidak" },
                  { label: "Keterangan Garansi", value: data.keterangan_garansi },
                ]}
              />
            </Section>

            {/* 🔹 Status & Pengerjaan */}
            <Section title="⚙️ Status & Pengerjaan">
              <DetailTable
                rows={[
                  { label: "Status TNS", value: data.status },
                  { label: "Teknisi Penanggung Jawab", value: data.assignedName || "-" },
                  {
                    label: "Waktu Dibuat",
                    value: data.createdAt
                      ? new Date(data.createdAt.seconds * 1000).toLocaleString()
                      : "-",
                  },
                  {
                    label: "Waktu Selesai",
                    value: data.closedAt
                      ? new Date(data.closedAt.seconds * 1000).toLocaleString()
                      : "-",
                  },
                  { label: "Catatan Teknisi", value: data.catatan_teknisi || "-" },
                ]}
              />
            </Section>

            {/* 🔹 Dokumentasi */}
            <Section title="📸 Dokumentasi TNS">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <PhotoGallery
                  title="Foto Pengambilan"
                  urls={data.foto_pengambilan_customer || []}
                />
                <PhotoGallery
                  title="Foto Penerimaan"
                  urls={data.foto_penerimaan_customer || []}
                />
              </div>
            </Section>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-5 flex justify-between items-center border-t">
            <button
              onClick={() => router.back()}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md transition-all shadow-sm"
            >
              ⬅ Kembali
            </button>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Alif Cyber Solution
            </p>
          </div>
        </motion.div>
      </main>
    </>
  );
}

/* ========= Reusable Components ========= */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      viewport={{ once: true }}
      className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition"
    >
      <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
        {title}
      </h2>
      {children}
    </motion.section>
  );
}

function DetailTable({ rows }: { rows: { label: string; value: any }[] }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map((r, i) => (
          <tr
            key={i}
            className="border-b last:border-none hover:bg-blue-50/30 transition"
          >
            <td className="py-2 text-gray-500 w-56 font-medium">{r.label}</td>
            <td className="py-2 text-gray-800">{r.value || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PhotoGallery({ title, urls }: { title: string; urls: string[] }) {
  return (
    <div>
      <h3 className="font-medium text-gray-700 mb-2">{title}</h3>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        {urls.length > 0 ? (
          <div className="flex flex-wrap gap-4">
            {urls.map((u, i) => (
              <img
                key={i}
                src={u}
                alt={`${title}-${i}`}
                className="w-36 h-36 object-cover rounded-lg border shadow-sm hover:scale-105 transition-transform"
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">
            Belum ada foto diunggah.
          </p>
        )}
      </div>
    </div>
  );
}

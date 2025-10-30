"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { useRouter } from "next/navigation";
import PhotoUpload from "@/app/components/PhotoUpload";
import EditFields from "@/app/components/EditFields";
import { motion } from "framer-motion";
import Navbar from "@/app/components/navbar";

export default function DetailServicePage({ params }: { params: { id: string } }) {
  const id = params.id;
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // 🔹 Tambah state edit mode

  // Load data Firestore
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "service_requests", id));
        if (snap.exists()) setData({ id: snap.id, ...snap.data() });
        else setData(null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Update data Firestore
  const handleSave = async (updated: any) => {
    if (!data) return;
    setSaving(true);
    try {
      const ref = doc(db, "service_requests", id);
      await updateDoc(ref, {
        ...updated,
        last_updated_at: serverTimestamp(),
      });
      await addDoc(collection(db, `service_requests/${id}/updates`), {
        updated_by: "admin",
        timestamp: serverTimestamp(),
        payload: updated,
      });
      const newSnap = await getDoc(ref);
      setData({ id: newSnap.id, ...newSnap.data() });
      setIsEditing(false); // 🔹 otomatis nonaktif setelah simpan
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  };

  // Upload foto
  const handlePhotoComplete = async (
    field: "foto_pengambilan_customer" | "foto_penerimaan_customer",
    url: string
  ) => {
    if (!data) return;
    const ref = doc(db, "service_requests", id);
    const existing = data[field] ?? [];
    const newVal = Array.isArray(existing) ? [...existing, url] : [url];
    await updateDoc(ref, { [field]: newVal });
    await addDoc(collection(db, `service_requests/${id}/updates`), {
      updated_by: "admin",
      timestamp: serverTimestamp(),
      payload: { [field]: url },
    });
    const snap = await getDoc(ref);
    setData({ id: snap.id, ...snap.data() });
  };

  // ======================== UI ========================
  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500 text-lg">
        Memuat data...
      </div>
    );

  if (!data)
    return (
      <div className="flex justify-center items-center h-screen text-red-500 text-lg">
        Data tidak ditemukan.
      </div>
    );

  return (
    <div>
      <Navbar/>
    
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
      >
        {/* HEADER */}
        <div className="bg-blue-700 text-white px-8 py-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Work Order #{data.track_number || data.id}
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
                ? "bg-green-600"
                : data.status === "Proses"
                ? "bg-yellow-500"
                : "bg-gray-400"
            }`}
          >
            {data.status || "Belum Ditentukan"}
          </span>
        </div>

        {/* BODY */}
        <div className="p-8 space-y-10">
          {/* CUSTOMER */}
          <Card title="🧑 Data Customer">
            <Grid2Col>
              <Info label="Nama" value={data.nama} />
              <Info label="No HP" value={data.no_hp} />
              <Info label="Email" value={data.email} />
              <Info label="Alamat" value={data.alamat} />
            </Grid2Col>
          </Card>

          {/* DEVICE */}
          <Card title="💻 Data Perangkat">
            <Grid2Col>
              <Info label="Merk" value={data.merk} />
              <Info label="Tipe" value={data.tipe} />
              <Info label="Serial Number" value={data.serial_number} />
              <Info label="Jenis Perangkat" value={(data.jenis_perangkat || []).join(", ")} />
              <Info label="Keluhan" value={data.keluhan} />
              <Info label="Spesifikasi Teknis" value={data.spesifikasi_teknis} />
              <Info label="Garansi" value={data.garansi ? "✅ Ya" : "❌ Tidak"} />
              <Info label="Keterangan Garansi" value={data.keterangan_garansi} />
            </Grid2Col>
          </Card>

          {/* EDIT STATUS */}
          <Card title="⚙️ Status & Pengerjaan">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-700">
                  {isEditing ? "Mode Edit Aktif" : "Tampilan Baca"}
                </h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-4 py-2 rounded-md text-white font-medium transition-all shadow-sm ${
                    isEditing ? "bg-gray-600 hover:bg-gray-700" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isEditing ? "Batal" : "Edit"}
                </button>
              </div>

              {/* Komponen Input */}
              <EditFields
                initial={data}
                onSave={handleSave}
                disabled={!isEditing} // 🔹 penting
              />

              {saving && (
                <p className="text-sm text-blue-500 mt-2 animate-pulse">
                  Menyimpan data...
                </p>
              )}
            </div>
          </Card>

          {/* FOTO */}
          <Card title="📸 Dokumentasi Pekerjaan">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <PhotoSection
                title="Foto Pengambilan"
                field="foto_pengambilan_customer"
                urls={data.foto_pengambilan_customer}
                onUpload={(url) =>
                  handlePhotoComplete("foto_pengambilan_customer", url)
                }
              />
              <PhotoSection
                title="Foto Penerimaan"
                field="foto_penerimaan_customer"
                urls={data.foto_penerimaan_customer}
                onUpload={(url) =>
                  handlePhotoComplete("foto_penerimaan_customer", url)
                }
              />
            </div>
          </Card>
        </div>

        {/* FOOTER */}
        <div className="bg-gray-50 px-8 py-5 flex justify-between items-center border-t">
          <button
            onClick={() => router.back()}
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md transition-all shadow-sm"
          >
            ⬅ Kembali
          </button>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Hibatillah Service Center
          </p>
        </div>
      </motion.div>
    </main>
    </div>
  );
}

/* ---------- Subkomponen ---------- */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      viewport={{ once: true }}
      className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition"
    >
      <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">{title}</h2>
      {children}
    </motion.section>
  );
}

function Grid2Col({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>;
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="font-medium text-gray-800 border-b border-gray-100 pb-1">
        {value || "-"}
      </span>
    </div>
  );
}

function PhotoSection({
  title,
  field,
  urls = [],
  onUpload,
}: {
  title: string;
  field: string;
  urls: string[];
  onUpload: (url: string) => void;
}) {
  return (
    <div>
      <h3 className="font-medium text-gray-700 mb-2">{title}</h3>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <PhotoUpload docId={field} folderName={field} onUploadComplete={onUpload} />
        <div className="flex flex-wrap gap-4 mt-4">
          {urls && urls.length > 0 ? (
            urls.map((u, i) => (
              <img
                key={i}
                src={u}
                alt={`${field}-${i}`}
                className="w-36 h-36 object-cover rounded-lg border shadow-sm hover:scale-105 transition-transform"
              />
            ))
          ) : (
            <p className="text-sm text-gray-400">Belum ada foto diunggah</p>
          )}
        </div>
      </div>
    </div>
  );
}

// src/app/admin/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import PhotoUpload from "@/components/PhotoUpload";
import EditFields from "@/components/EditFields";

import { useRouter } from "next/navigation";

type DataType = any;

export default function DetailPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [data, setData] = useState<DataType | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        const d = await getDoc(doc(db, "service_requests", id));
        if (d.exists()) setData({ id: d.id, ...d.data() });
        else setData(null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSave = async (updated: any) => {
    if (!data) return;
    const docRef = doc(db, "service_requests", id);
    await updateDoc(docRef, {
      ...updated,
      last_updated_at: serverTimestamp(),
    });
    // record update in subcollection
    await addDoc(collection(db, `service_requests/${id}/updates`), {
      updated_by: "admin",
      timestamp: serverTimestamp(),
      payload: updated,
    });
    // reload
    const d = await getDoc(docRef);
    setData({ id: d.id, ...d.data() });
  };

  const handlePhotoComplete = async (field: "foto_pengambilan_customer" | "foto_penerimaan_customer", url: string) => {
    if (!data) return;
    const docRef = doc(db, "service_requests", id);
    // if field is array, push; else set single url
    const exists = data[field] ?? [];
    const newVal = Array.isArray(exists) ? [...exists, url] : [url];
    await updateDoc(docRef, { [field]: newVal });
    // also record update
    await addDoc(collection(db, `service_requests/${id}/updates`), {
      updated_by: "admin",
      timestamp: serverTimestamp(),
      payload: { [field]: url },
    });
    const d = await getDoc(docRef);
    setData({ id: d.id, ...d.data() });
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!data) return <div className="p-6">Data tidak ditemukan.</div>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Order Service Detail — {data.track_number || data.id}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Data Pesanan</h3>
            <EditFields initial={data} onSave={handleSave} />
          </div>

          <div>
            <h3 className="font-semibold mb-2">Foto Pengambilan</h3>
            <div className="mb-4">
              <PhotoUpload docId={id} folderName="foto_pengambilan_customer" onUploadComplete={(url) => handlePhotoComplete("foto_pengambilan_customer", url)} />
              <div className="flex flex-wrap gap-2 mt-3">
                {(data.foto_pengambilan_customer || []).map((u: string, i: number) => (
                  <img key={i} src={u} className="w-28 h-28 object-cover rounded border" alt={`ambil-${i}`} />
                ))}
              </div>
            </div>

            <h3 className="font-semibold mb-2">Foto Penerimaan</h3>
            <div>
              <PhotoUpload docId={id} folderName="foto_penerimaan_customer" onUploadComplete={(url) => handlePhotoComplete("foto_penerimaan_customer", url)} />
              <div className="flex flex-wrap gap-2 mt-3">
                {(data.foto_penerimaan_customer || []).map((u: string, i: number) => (
                  <img key={i} src={u} className="w-28 h-28 object-cover rounded border" alt={`terima-${i}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button className="bg-gray-600 text-white px-4 py-2 rounded" onClick={() => router.back()}>Kembali</button>
        </div>
      </div>
    </div>
  );
}

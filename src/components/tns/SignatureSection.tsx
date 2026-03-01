"use client";

import React, { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { doc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { X, Save, Trash2 } from "lucide-react";

type Props = {
  docId: string;
  existingSignature?: string;
  existingSignaturePublicId?: string;
  user?: any;
  setErrorMsg?: (m: string | null) => void;
  setSuccessMsg?: (m: string | null) => void;
  className?: string;
};

export default function SignatureSection({
  docId,
  existingSignature,
  existingSignaturePublicId,
  user,
  setErrorMsg,
  setSuccessMsg,
  className,
}: Props) {
  const sigRef = useRef<SignatureCanvas | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [publicId, setPublicId] = useState<string | null>(null);
  const [cloudConfigOk, setCloudConfigOk] = useState(true);

  useEffect(() => {
    setPreview(existingSignature || null);
    setPublicId(existingSignaturePublicId || null);
    // Check Cloudinary config
    try {
      if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) throw new Error("Missing cloud name");
      if (!process.env.NEXT_PUBLIC_SIGNATURE_PRESET) throw new Error("Missing signature preset");
      setCloudConfigOk(true);
    } catch (e) {
      console.warn("Cloudinary signature config missing:", e);
      setCloudConfigOk(false);
    }
  }, [existingSignature, existingSignaturePublicId]);

  const uploadToCloudinary = async (dataUrl: string) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_SIGNATURE_PRESET;
    if (!preset) throw new Error("Cloudinary signature preset is not configured.");
    
    const fd = new FormData();
    fd.append("file", dataUrl);
    fd.append("upload_preset", preset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: fd,
    });
    
    if (!res.ok) throw new Error("Cloudinary upload failed.");
    const data = await res.json();
    return { secure_url: data.secure_url as string, public_id: data.public_id as string };
  };

  const handleSave = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setErrorMsg?.("Tanda tangan tidak boleh kosong.");
      return;
    }
    try {
      setSaving(true);
      setErrorMsg?.(null);
      const dataUrl = sigRef.current.getCanvas().toDataURL("image/png");
      const { secure_url, public_id } = await uploadToCloudinary(dataUrl);

      await updateDoc(doc(db, "service_requests", docId), {
        customer_signature_url: secure_url,
        customer_signature_public_id: public_id,
        updatedAt: serverTimestamp(),
        status_log: arrayUnion({
          status: "signature_saved",
          note: "Tanda tangan customer tersimpan",
          updatedBy: user?.email || "unknown user",
          updatedAt: Date.now(),
        }),
      });

      setPreview(secure_url);
      setPublicId(public_id);
      setSuccessMsg?.("Tanda tangan berhasil disimpan.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg?.(err.message || "Gagal menyimpan tanda tangan.");
    } finally {
      setSaving(false);
    }
  };
  
  const handleDelete = async () => {
    if (!publicId) {
       setErrorMsg?.("Tidak ada tanda tangan untuk dihapus.");
       setPreview(null);
       setPublicId(null);
       return;
    }
    if (!user) {
      setErrorMsg?.("Anda harus login untuk menghapus tanda tangan.");
      return;
    }
    try {
      setDeleting(true);
      setErrorMsg?.(null);
      const token = await user.getIdToken();
      const res = await fetch('/api/delete-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ public_id: publicId })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Gagal menghapus gambar dari Cloudinary.');
      }

      await updateDoc(doc(db, "service_requests", docId), {
        customer_signature_url: null,
        customer_signature_public_id: null,
      });

      setPreview(null);
      setPublicId(null);
      sigRef.current?.clear();
      setSuccessMsg?.("Tanda tangan berhasil dihapus. Silakan buat yang baru.");

    } catch (err: any) {
      console.error(err);
      setErrorMsg?.(err.message || "Gagal menghapus tanda tangan.");
    } finally {
      setDeleting(false);
    }
  };

  const handleClear = () => sigRef.current?.clear();

  return (
    <section className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-blue-600">Tanda Tangan Digital (Persetujuan)</h3>

      {preview ? (
        <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-lg font-semibold text-green-700">✓ Sudah Ditandatangani</p>
              <p className="text-sm text-green-600 mt-1">Anda telah menyetujui semua persyaratan layanan</p>
            </div>
            <p className="text-sm text-gray-600 text-center">Tanda tangan tersimpan:</p>
            <div className="h-40 bg-gray-100 rounded flex items-center justify-center p-2 border border-gray-300">
              <img src={preview} className="h-full object-contain" alt="Saved Signature" />
            </div>
            <button 
              onClick={handleDelete} 
              disabled={deleting}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:bg-red-400"
            >
              {deleting ? "Menghapus..." : <><Trash2 size={18} /> Hapus & Ulangi Tanda Tangan</>}
            </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Silakan tanda tangan di area bawah ini:</p>
            <div className="h-40 bg-gray-100 rounded-lg border border-gray-300">
              <SignatureCanvas ref={sigRef} canvasProps={{ className: "w-full h-full" }} penColor="black" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button 
                onClick={handleSave} 
                disabled={saving || !cloudConfigOk} 
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:bg-blue-400"
              >
                {saving ? "Menyimpan..." : <><Save size={18} /> Simpan Tanda Tangan</>}
              </button>
              <button 
                onClick={handleClear} 
                disabled={saving}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                title="Hapus tanda tangan di kanvas"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
             <p className="text-sm text-gray-600 font-semibold mb-3">Dengan menandatangani, Anda menyetujui:</p>
             <div className="space-y-2 text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                <div className="space-y-3 text-sm">
                  <div className="flex gap-3">
                    <span className="text-blue-600 font-bold flex-shrink-0">1.</span>
                    <div>
                      <p className="font-semibold text-gray-800">Perbaikan sesuai kemampuan teknisi</p>
                      <p className="text-gray-600">Perbaikan dilakukan sesuai kapasitas, ilmu, dan pengalaman teknisi.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-blue-600 font-bold flex-shrink-0">2.</span>
                    <div>
                      <p className="font-semibold text-gray-800">Risiko kerusakan bisa bertambah</p>
                      <p className="text-gray-600">Jika kondisi kerusakan berubah/bertambah parah saat diperbaiki, itu di luar tanggung jawab penyedia layanan.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-blue-600 font-bold flex-shrink-0">3.</span>
                    <div>
                      <p className="font-semibold text-gray-800">Perbaikan setelah persetujuan</p>
                      <p className="text-gray-600">Estimasi waktu dan biaya diinformasikan terlebih dahulu, perbaikan dilakukan setelah disetujui pelanggan.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-blue-600 font-bold flex-shrink-0">4.</span>
                    <div>
                      <p className="font-semibold text-gray-800">Tidak bisa batal sepihak</p>
                      <p className="text-gray-600">Perbaikan tidak bisa dibatalkan jika sudah dikonfirmasi.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-blue-600 font-bold flex-shrink-0">5.</span>
                    <div>
                      <p className="font-semibold text-gray-800">Barang tidak diambil 30 hari</p>
                      <p className="text-gray-600">Penyedia layanan tidak bertanggung jawab jika barang tidak diambil dalam 30 hari setelah konfirmasi selesai, termasuk risiko force majeure.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-blue-600 font-bold flex-shrink-0">6.</span>
                    <div>
                      <p className="font-semibold text-gray-800">Data & software tanggung jawab pelanggan</p>
                      <p className="text-gray-600">Data, dokumen, dan aplikasi adalah tanggung jawab pelanggan.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-blue-600 font-bold flex-shrink-0">7.</span>
                    <div>
                      <p className="font-semibold text-gray-800">Risiko kehilangan data</p>
                      <p className="text-gray-600">Kehilangan/kerusakan data saat perbaikan bukan tanggung jawab teknisi, pelanggan dianggap sudah backup.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-blue-600 font-bold flex-shrink-0">8.</span>
                    <div>
                      <p className="font-semibold text-gray-800">Biaya pembatalan (Cancel Fee)</p>
                      <p className="text-gray-600">Cancel fee berkisar Rp50.000 – Rp100.000 sesuai tingkat kerusakan.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-blue-600 font-bold flex-shrink-0">9.</span>
                    <div>
                      <p className="font-semibold text-gray-800">Garansi terbatas</p>
                      <p className="text-gray-600">Garansi hanya untuk kerusakan yang sama, batal jika segel rusak, barang cacat/terbakar, atau akibat kelalaian pemakaian.</p>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}
      {!cloudConfigOk && (
        <div className="mt-3 p-3 rounded bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
          Cloudinary signature preset atau cloud name belum dikonfigurasi. Simpan tanda tangan dinonaktifkan.
        </div>
      )}
    </section>
  );
}

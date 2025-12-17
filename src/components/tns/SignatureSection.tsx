"use client";

import React, { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { doc, updateDoc, arrayUnion, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { X, Check, Trash2, Edit, Save } from "lucide-react";

type Props = {
  docId: string;
  existingSignature?: string;
  existingSignaturePublicId?: string;
  user?: any;
  setErrorMsg?: (m: string | null) => void;
  setSuccessMsg?: (m: string | null) => void;
  className?: string; // Allow external classes
};

export default function SignatureSection({
  docId,
  existingSignature,
  existingSignaturePublicId,
  user,
  setErrorMsg,
  setSuccessMsg,
  className, // Destructure className
}: Props) {
  const sigRef = useRef<SignatureCanvas | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [publicId, setPublicId] = useState<string | null>(null);

  useEffect(() => {
    setPreview(existingSignature || null);
    setPublicId(existingSignaturePublicId || null);
  }, [existingSignature, existingSignaturePublicId]);

  const uploadToCloudinary = async (dataUrl: string) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_SIGNATURE_PRESET; // Use a specific preset for signatures
    
    if (!preset) {
      throw new Error("Cloudinary signature preset is not configured.");
    }
    
    const fd = new FormData();
    fd.append("file", dataUrl);
    fd.append("upload_preset", preset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: fd,
    });
    
    if (!res.ok) {
      throw new Error("Cloudinary upload failed.");
    }

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
          updatedAt: new Date(),
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
       // Also clear frontend in case of inconsistent state
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
    <section className={`bg-[#0f1c33] border border-blue-900/30 rounded-xl p-6 space-y-4 shadow-lg ${className}`}>
      <h3 className="text-xl font-bold text-yellow-400">Tanda Tangan Digital (Persetujuan)</h3>

      {preview ? (
        // === VIEW WHEN SIGNATURE IS SAVED ===
        <div className="space-y-4">
            <p className="text-sm text-gray-400">Tanda tangan sudah tersimpan:</p>
            <div className="h-40 bg-black/20 rounded flex items-center justify-center p-2 border border-blue-800">
              <img src={preview} className="h-full object-contain" alt="Saved Signature" />
            </div>
            <button 
              onClick={handleDelete} 
              disabled={deleting}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:bg-red-400"
            >
              {deleting ? (
                <>
                  <span className="animate-spin text-xl">⏳</span>
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 size={18} />
                  <span>Hapus & Ulangi Tanda Tangan</span>
                </>
              )}
            </button>
        </div>
      ) : (
        // === VIEW WHEN EDITING SIGNATURE ===
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <p className="text-sm text-gray-400">Silakan tanda tangan di area bawah ini:</p>
            <div className="h-40 bg-black/20 rounded-lg border border-blue-800">
              <SignatureCanvas ref={sigRef} canvasProps={{ className: "w-full h-full" }} penColor="white" />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button 
                onClick={handleSave} 
                disabled={saving} 
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:bg-blue-400"
              >
                {saving ? (
                  <>
                    <span className="animate-spin text-xl">⏳</span>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Simpan Tanda Tangan</span>
                  </>
                )}
              </button>
              <button 
                onClick={handleClear} 
                disabled={saving}
                className="p-2 text-gray-400 hover:text-white hover:bg-red-600/50 rounded-lg transition-colors"
                title="Hapus tanda tangan di kanvas"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
             <p className="text-sm text-gray-400">Dengan menandatangani, Anda menyetujui syarat dan ketentuan yang berlaku.</p>
             <div className="prose prose-sm text-gray-300 bg-blue-900/20 p-3 rounded-lg border border-blue-800">
                <ul className="text-gray-300">
                  <li>Saya adalah pemilik sah dari perangkat yang diserahkan.</li>
                  <li>Saya menyetujui estimasi biaya perbaikan yang diberikan.</li>
                  <li>Saya memahami bahwa ada risiko dalam proses perbaikan.</li>
                </ul>
             </div>
          </div>
        </div>
      )}
    </section>
  );
}

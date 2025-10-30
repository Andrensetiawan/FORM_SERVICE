// src/components/PhotoUpload.tsx
"use client";

import { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebaseConfig";

type Props = {
  docId: string;
  folderName: string; // e.g. "foto_pengambilan_customer"
  onUploadComplete?: (url: string) => void;
};

export default function PhotoUpload({ docId, folderName, onUploadComplete }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  };

const handleUpload = async () => {
    if (!file) return alert("Pilih file dulu");
    try {
      setUploading(true);
      const path = `${folderName}/${docId}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      const snap = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snap.ref);
      onUploadComplete?.(url);
      setFile(null);
      setPreview(null);
      alert("✅ Upload sukses!");
    } catch (err) {
      console.error("Upload error", err);
      alert("❌ Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-md w-fit space-y-3">
      <label className="font-semibold text-gray-700">📸 Upload Foto</label>
      <input
        type="file"
        accept="image/*"
        onChange={handleSelect}
        className="block border border-gray-300 rounded p-1 text-sm"
      />
      {preview && (
        <img
          src={preview}
          alt="preview"
          className="w-60 h-60 object-cover rounded-md border mx-auto"
        />
      )}
      <button
        onClick={handleUpload}
        disabled={uploading || !file}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md w-full disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload Foto"}
      </button>
    </div>
  );
}

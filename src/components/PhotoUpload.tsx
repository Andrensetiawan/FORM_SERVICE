"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Upload, X } from "lucide-react";
import useAuth from "@/hooks/useAuth"; // Import useAuth

type Props = {
  docId: string;
  folderName: string; // e.g. "foto_pengambilan_customer"
  label?: string;
  onUploadComplete?: (url: string, publicId: string) => void;
};

export default function PhotoUpload({ 
  docId, 
  folderName, 
  label = "📸 Upload Foto",
  onUploadComplete 
}: Props) {
  const { user } = useAuth(); // Get user from auth hook
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedPublicId, setUploadedPublicId] = useState<string | null>(null);

  // Handle file selection
  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    
    if (f) {
      // Validate file size (max 5MB)
      if (f.size > 5 * 1024 * 1024) {
        toast.error("File terlalu besar. Max 5MB.");
        return;
      }
      
      // Validate file type
      if (!f.type.startsWith("image/")) {
        toast.error("File harus berupa gambar.");
        return;
      }

      setFile(f);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(f);
    }
  };

  // Handle file upload to Cloudinary
  const handleUpload = async () => {
    if (!file) {
      toast.error("Pilih file dulu");
      return;
    }
    if (!user) {
      toast.error("Anda harus login untuk upload.");
      return;
    }

    try {
      setUploading(true);

      const token = await user.firebaseUser.getIdToken();

      // Convert to FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folderPath", `${folderName}/${docId}`); // Kirim folder path

      // Upload to our API route with Authorization header
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload gagal");
      }

      const data = await response.json();
      
      if (!data.success || !data.secure_url) {
        throw new Error("URL upload tidak diterima");
      }

      // Save to state
      setUploadedUrl(data.secure_url);
      setUploadedPublicId(data.public_id);
      
      // Callback with URL and public_id
      onUploadComplete?.(data.secure_url, data.public_id);
      
      // Clear file input
      setFile(null);
      setPreview(null);
      
      toast.success("✅ Upload sukses!");
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "❌ Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  // Handle remove uploaded image
  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setUploadedUrl(null);
    setUploadedPublicId(null);
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-md space-y-4 border border-gray-200">
      <label className="block font-semibold text-gray-700">{label}</label>

      {!uploadedUrl ? (
        <>
          {/* File Input */}
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleSelect}
              className="hidden"
              id={`file-input-${docId}`}
              disabled={uploading}
            />
            <label
              htmlFor={`file-input-${docId}`}
              className="flex items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Klik untuk pilih file atau drag & drop
                </p>
              </div>
            </label>
          </div>

          {/* Preview */}
          {preview && (
            <div className="relative w-full">
              <img
                src={preview}
                alt="preview"
                className="w-full h-64 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Upload Button */}
          {file && (
            <button
              onClick={handleUpload}
              disabled={uploading || !file}
              className={`w-full py-2.5 font-semibold rounded-lg text-white transition flex items-center justify-center gap-2 ${
                uploading || !file
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {uploading ? (
                <>
                  <span className="animate-spin">⌛</span>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload ke Cloudinary
                </>
              )}
            </button>
          )}
        </>
      ) : (
        <>
          {/* Uploaded Image Display */}
          <div className="relative w-full">
            <img
              src={uploadedUrl}
              alt="uploaded"
              className="w-full h-64 object-cover rounded-lg border-2 border-green-400"
            />
            <div className="absolute top-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
              ✅ Upload Sukses
            </div>
          </div>

          {/* File Info */}
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 space-y-1">
            <p>
              <strong>Folder:</strong> {folderName}/{docId}
            </p>
            <p>
              <strong>Public ID:</strong> <span className="font-mono text-xs">{uploadedPublicId}</span>
            </p>
          </div>

          {/* Clear Button */}
          <button
            onClick={handleRemove}
            className="w-full py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 font-semibold transition"
          >
            🗑️ Hapus & Upload Ulang
          </button>
        </>
      )}
    </div>
  );
}

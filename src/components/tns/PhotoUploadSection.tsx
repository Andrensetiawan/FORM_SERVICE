"use client";

import React, { useEffect, useRef, useState, forwardRef } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { Trash2, FileUp, Camera, CameraOff, Loader2 } from "lucide-react";
import useAuth from "@/hooks/useAuth"; // Import useAuth

// --- EXPORTED TYPE ---
export interface MediaItem {
  id: string;
  url: string;
  type: "image" | "video";
  file?: File; 
}

// --- PROPS ---
type Props = {
  title?: string;
  size?: "normal" | "small";
  showCamera?: boolean;

  // Standalone Mode props
  docId?: string;
  field?: string;
  existingUrl?: string | string[];
  onUpdate?: (urls: string[]) => void;

  // Controlled Mode props
  items?: MediaItem[];
  onItemsChange?: (items: MediaItem[]) => void;
  
  // Common
  setErrorMsg?: (m: string | null) => void;
  setSuccessMsg?: (m: string | null) => void;
  disabled?: boolean; // New prop for disabling the section
};

// Helper to extract Public ID from Cloudinary URL
const getPublicIdFromUrl = (url: string): string | null => {
    try {
        const regex = /upload\/(?:v\d+\/)?([^\.]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    } catch (e) {
        console.error("Invalid Cloudinary URL", e);
        return null;
    }
};

const MediaUploadSection = forwardRef(({
  title = "Lampiran",
  size = "normal",
  showCamera = true,
  docId,
  field,
  existingUrl,
  onUpdate,
  items,
  onItemsChange,
  setErrorMsg,
  setSuccessMsg,
  disabled = false,
}: Props, ref) => {
  const { user } = useAuth(); // Get user from auth hook
  const mode = (items && onItemsChange) ? 'controlled' : 'standalone';

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [internalItems, setInternalItems] = useState<MediaItem[]>([]);
  const mediaItems = mode === 'controlled' ? items! : internalItems;
  const setMediaItems = mode === 'controlled' ? onItemsChange! : setInternalItems;

  const [cameraActive, setCameraActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'standalone') {
        const urls = Array.isArray(existingUrl) ? existingUrl : (typeof existingUrl === 'string' && existingUrl ? [existingUrl] : []);
        const initialItems: MediaItem[] = urls.map(url => ({
            id: url,
            url,
            type: url.match(/\.(jpeg|jpg|gif|png)$/) != null ? "image" : "video",
        }));
        setInternalItems(initialItems);
    }
  }, [existingUrl, mode]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    const newItems: MediaItem[] = Array.from(files).map((file) => ({
      id: `file-${Date.now()}-${file.name}`,
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" : "image",
      file: file,
    }));
    setMediaItems([...mediaItems, ...newItems]);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
    const dataUrl = c.toDataURL("image/jpeg", 0.9);
    const newItem: MediaItem = { id: `cam-${Date.now()}`, url: dataUrl, type: "image" };
    setMediaItems([...mediaItems, newItem]);
  };

  const deleteMedia = async (id: string) => {
    const itemToDelete = mediaItems.find(item => item.id === id);
    if (!itemToDelete) return;

    if (!user) {
      setErrorMsg?.("Anda harus login untuk menghapus file.");
      return;
    }

    // If it's a new file not yet uploaded, just remove from state
    if (itemToDelete.file || itemToDelete.url.startsWith("data:") || itemToDelete.url.startsWith("blob:")) {
        if (itemToDelete.url.startsWith("blob:")) {
            URL.revokeObjectURL(itemToDelete.url);
        }
        const updated = mediaItems.filter(item => item.id !== id);
        setMediaItems(updated);
        return;
    }

    // If it's an uploaded file, delete from Cloudinary
    setDeletingId(id);
    try {
      const public_id = getPublicIdFromUrl(itemToDelete.url);
      if (!public_id) {
        throw new Error("Tidak dapat menemukan public_id dari URL.");
      }

      const token = await user.firebaseUser.getIdToken();
      const res = await fetch('/api/delete-image', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ public_id }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal menghapus file dari cloud.");
      }
      
      setSuccessMsg?.("File berhasil dihapus dari cloud.");
      
      // Update state after successful deletion
      const updated = mediaItems.filter((item) => item.id !== id);
      setMediaItems(updated);

       if(mode === 'standalone' && onUpdate){
        const urls = updated.map(item => item.url);
        onUpdate(urls)
       }

    } catch (err: any) {
        setErrorMsg?.(err.message);
    } finally {
        setDeletingId(null);
    }
  };
  
  const startCamera = async () => {
    if (!showCamera) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setErrorMsg?.("Tidak bisa mengakses kamera.");
      setCameraActive(false);
    }
  };
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    }
    setCameraActive(false);
  };


  // --- STANDALONE MODE LOGIC ---
  const getPreset = () => {
    if(!field) return undefined;
    let preset: string | undefined;
    if (field.includes("signature")) preset = process.env.NEXT_PUBLIC_SIGNATURE_PRESET;
    else if (field.includes("unit_work_log")) preset = process.env.NEXT_PUBLIC_TEKNISI_PRESET;
    else {
      switch (field) {
        case "handover_photo_url": preset = process.env.NEXT_PUBLIC_HANDOVER_PRESET; break;
        case "pickup_photo_url": preset = process.env.NEXT_PUBLIC_PICKUP_PRESET; break;
        case "transfer_proof_url": preset = process.env.NEXT_PUBLIC_PAYMENT_PRESET; break;
      }
    }
    if (!preset) throw new Error("Preset Cloudinary tidak ditemukan!");
    return preset;
  };

  const uploadToCloudinary = async (item: MediaItem) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = getPreset();
    const fd = new FormData();
    if (item.file) fd.append("file", item.file);
    else if (item.url.startsWith("data:")) {
       const blob = await (await fetch(item.url)).blob();
       fd.append("file", blob, `capture-${Date.now()}.jpg`);
    } else return item.url;
    fd.append("upload_preset", preset!);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Upload error");
    return data.secure_url as string;
  };
  
  const saveMedia = async () => {
    if (mode !== 'standalone' || !docId || !field) return;
    if (!hasUnsavedMedia) return;
    setUploading(true);
    try {
      const uploadPromises = mediaItems.map(item => uploadToCloudinary(item));
      const allUrls = await Promise.all(uploadPromises);
      
      const ref = doc(db, "service_requests", docId);
      await updateDoc(ref, { [field]: allUrls, updatedAt: serverTimestamp() });

      setSuccessMsg?.(`Lampiran berhasil disimpan.`);
      onUpdate?.(allUrls);
      setInternalItems(allUrls.map(url => ({id: url, url, type: url.match(/\.(jpeg|jpg|gif|png)$/) != null ? "image" : "video" })));
    } catch (err: any) {
      setErrorMsg?.("Gagal menyimpan lampiran: " + err.message);
    } finally {
      setUploading(false);
    }
  };
  
  const hasUnsavedMedia = mediaItems.some(item => item.file || item.url.startsWith("data:"));
  const imageHeightClass = size === "small" ? "h-20" : "h-28";
  const videoHeightClass = size === "small" ? "h-32" : "h-48";

  return (
    <div className={`bg-[#0f1c33] p-4 rounded-xl border border-blue-900/30 shadow-lg ${disabled ? "disabled:cursor-not-allowed" : ""}`}>
      <h4 className="text-yellow-400 font-semibold mb-3">{title}</h4>
        <div className="flex flex-col items-center">
            {showCamera && (
                <div className="w-full mb-3 relative">
                    <video ref={videoRef} className={`${videoHeightClass} rounded shadow bg-black w-full object-cover ${cameraActive ? "" : "hidden"}`} playsInline muted />
                    {!cameraActive && (
                        <div className={`absolute inset-0 flex items-center justify-center bg-black rounded`}>
                            <p className="text-gray-400">Kamera tidak aktif.</p>
                        </div>
                    )}
                </div>
            )}
            <div className="flex flex-wrap justify-center gap-2">
                {showCamera && <button onClick={capturePhoto} disabled={!cameraActive || disabled} className="px-4 py-2 bg-blue-600 rounded text-xs disabled:bg-gray-500 flex items-center gap-2 disabled:cursor-not-allowed"><Camera size={14}/> Ambil Foto</button>}
                <button onClick={() => fileInputRef.current?.click()} disabled={disabled} className="px-4 py-2 bg-indigo-600 rounded text-xs flex items-center gap-2 disabled:cursor-not-allowed"><FileUp size={14} /> Pilih File</button>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple accept="image/*,video/*" className="hidden" disabled={disabled} />
                {showCamera && <button onClick={() => (cameraActive ? stopCamera() : startCamera())} disabled={disabled} className="px-4 py-2 bg-gray-700 rounded text-xs flex items-center gap-2 disabled:cursor-not-allowed">{cameraActive ? <CameraOff size={14}/> : <Camera size={14}/>} {cameraActive ? "Matikan" : "Nyalakan"}</button>}
            </div>
        </div>

        {mediaItems.length > 0 && (
            <div className="mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {mediaItems.map((item) => (
                <div key={item.id} className="relative group">
                    {item.type === 'image' ? <img src={item.url} alt="Lampiran" className={`${imageHeightClass} w-full rounded object-cover bg-black`} /> : <video src={item.url} className={`${imageHeightClass} w-full rounded object-cover bg-black`} controls />}
                    <button onClick={() => deleteMedia(item.id)} disabled={deletingId === item.id || disabled} className="absolute top-1 right-1 p-1 bg-red-600/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100 disabled:cursor-not-allowed"><Trash2 size={12} /></button>
                    {deletingId === item.id && <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-md"><Loader2 className="animate-spin text-white"/></div>}
                </div>
                ))}
            </div>
            {mode === 'standalone' && (
                 <div className="flex justify-center gap-3 mt-3">
                    <button onClick={saveMedia} disabled={uploading || !hasUnsavedMedia || disabled} className="px-6 py-2 bg-green-600 text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed">
                        {uploading ? "Menyimpan..." : "Simpan Lampiran"}
                    </button>
                </div>
            )}
            </div>
        )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
});

MediaUploadSection.displayName = "MediaUploadSection";
export default MediaUploadSection;
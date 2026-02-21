"use client";

import React, { useEffect, useRef, useState, forwardRef } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { Trash2, FileUp, Camera, CameraOff, Loader2 } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { MediaItem } from "@/components/tns/types";

type Props = {
  title?: string;
  size?: "normal" | "small";
  showCamera?: boolean;
  docId?: string;
  field?: string;
  existingUrl?: string | string[];
  onUpdate?: (urls: string[]) => void;
  items?: MediaItem[];
  onItemsChange?: (items: MediaItem[]) => void;
  setErrorMsg?: (m: string | null) => void;
  setSuccessMsg?: (m: string | null) => void;
  disabled?: boolean;
};

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

const MediaUploadSection = forwardRef<HTMLDivElement, Props>(({
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
}, ref) => {
  const { user } = useAuth();
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
  const [previewingImage, setPreviewingImage] = useState<string | null>(null);
  const [cloudConfigOk, setCloudConfigOk] = useState(true);

  useEffect(() => {
    if (mode === 'standalone') {
        const urls = Array.isArray(existingUrl) ? existingUrl : (typeof existingUrl === 'string' && existingUrl ? [existingUrl] : []);
        const initialItems: MediaItem[] = urls.map(url => ({
          id: url,
          url,
          type: url.match(/\.(jpeg|jpg|gif|png)$/) != null ? "image" : "video",
          caption: "",
        }));
        setInternalItems(initialItems);
    }
    // Check Cloudinary config (only relevant when saving/uploading)
    try {
      if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) throw new Error("Missing cloud name");
      if (field) {
        // getPreset will throw if preset missing
        getPreset(field);
      }
      setCloudConfigOk(true);
    } catch (e) {
      console.warn("Cloudinary config missing or incomplete for MediaUploadSection:", e);
      setCloudConfigOk(false);
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
      caption: "",
      fileName: file.name,
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
    const newItem: MediaItem = { id: `cam-${Date.now()}`, url: dataUrl, type: "image", caption: "" };
    setMediaItems([...mediaItems, newItem]);
  };

  const deleteMedia = async (id: string) => {
    const itemToDelete = mediaItems.find(item => item.id === id);
    if (!itemToDelete) return;

    if (!user) {
      setErrorMsg?.("Anda harus login untuk menghapus file.");
      return;
    }

    if (itemToDelete.file || itemToDelete.url.startsWith("data:") || itemToDelete.url.startsWith("blob:")) {
        if (itemToDelete.url.startsWith("blob:")) {
            URL.revokeObjectURL(itemToDelete.url);
        }
        const updated = mediaItems.filter(item => item.id !== id);
        setMediaItems(updated);
        return;
    }

    setDeletingId(id);
    try {
      const public_id = getPublicIdFromUrl(itemToDelete.url);
      if (!public_id) {
        throw new Error("Tidak dapat menemukan public_id dari URL.");
      }

      const token = await user.firebaseUser.getIdToken();
      const res = await fetch('/api/delete-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ public_id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Gagal menghapus file dari cloud.");
      
      setSuccessMsg?.("File berhasil dihapus dari cloud.");
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

  const getPreset = (targetField?: string) => {
    const effectiveField = targetField ?? field;
    if (!effectiveField) return undefined;
    let preset: string | undefined;
    if (effectiveField.includes("signature")) preset = process.env.NEXT_PUBLIC_SIGNATURE_PRESET;
    else if (effectiveField.includes("unit_work_log")) preset = process.env.NEXT_PUBLIC_TEKNISI_PRESET;
    else {
      switch (effectiveField) {
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
      setInternalItems(allUrls.map(url => ({id: url, url, type: url.match(/\.(jpeg|jpg|gif|png)$/) != null ? "image" : "video", caption: "" })));
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
    <div ref={ref} className={`bg-gray-50 p-4 rounded-xl border border-gray-200 ${disabled ? "cursor-not-allowed opacity-60" : ""}`}>
      <h4 className="text-gray-700 font-semibold mb-3 text-sm">{title}</h4>
        <div className="flex flex-col items-center">
            {showCamera && (
                <div className="w-full mb-3 relative">
                    <video ref={videoRef} className={`${videoHeightClass} rounded shadow bg-black w-full object-cover ${cameraActive ? "" : "hidden"}`} playsInline muted />
                    {!cameraActive && (
                        <div className={`absolute inset-0 flex items-center justify-center bg-gray-200 rounded`}>
                            <p className="text-gray-500 text-xs">Kamera tidak aktif</p>
                        </div>
                    )}
                </div>
            )}
            <div className="flex flex-wrap justify-center gap-2">
                {showCamera && <button onClick={capturePhoto} disabled={!cameraActive || disabled || !cloudConfigOk} className="px-4 py-2 bg-blue-600 rounded text-xs text-white flex items-center gap-2 disabled:bg-gray-400"><Camera size={14}/> Ambil Foto</button>}
                <button onClick={() => fileInputRef.current?.click()} disabled={disabled || !cloudConfigOk} className="px-4 py-2 bg-indigo-600 text-white rounded text-xs flex items-center gap-2 disabled:bg-gray-400"><FileUp size={14} /> Pilih File</button>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple accept="image/*,video/*" className="hidden" disabled={disabled} />
                {showCamera && <button onClick={() => (cameraActive ? stopCamera() : startCamera())} disabled={disabled} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-xs flex items-center gap-2 disabled:bg-gray-400">{cameraActive ? <CameraOff size={14}/> : <Camera size={14}/>} {cameraActive ? "Matikan" : "Nyalakan"}</button>}
            </div>
        </div>

        {!cloudConfigOk && (
          <div className="mt-3 p-3 rounded bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
            Cloudinary belum dikonfigurasi. Upload dinonaktifkan — pastikan environment variables NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME dan preset untuk field `{field}` terpasang.
          </div>
        )}

        {mediaItems.length > 0 && (
            <div className="mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {mediaItems.map((item) => (
                <div key={item.id} className="relative group">
                    {item.type === 'image' ? <img src={item.url} alt="Lampiran" onClick={() => setPreviewingImage(item.url)} className={`${imageHeightClass} w-full rounded object-cover border border-gray-200 cursor-pointer`} /> : <video src={item.url} className={`${imageHeightClass} w-full rounded object-cover border border-gray-200`} controls />}
                    <button onClick={() => deleteMedia(item.id)} disabled={deletingId === item.id || disabled} className="absolute top-1 right-1 p-1 bg-red-600/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100 disabled:cursor-not-allowed"><Trash2 size={12} /></button>
                    {deletingId === item.id && <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-md"><Loader2 className="animate-spin text-gray-800"/></div>}
                </div>
                ))}
            </div>
            {mode === 'standalone' && (
                 <div className="flex justify-center gap-3 mt-3">
                    <button onClick={saveMedia} disabled={uploading || !hasUnsavedMedia || disabled} className="px-6 py-2 bg-green-600 text-white text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed">
                        {uploading ? "Menyimpan..." : "Simpan Lampiran"}
                    </button>
                </div>
            )}
            </div>
        )}

      {previewingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={() => setPreviewingImage(null)}>
          <img src={previewingImage} alt="Preview" className="max-w-[90vw] max-h-[90vh] object-contain" />
          <button onClick={() => setPreviewingImage(null)} className="absolute top-4 right-4 text-white text-3xl font-bold">&times;</button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
});

MediaUploadSection.displayName = "MediaUploadSection";
export default MediaUploadSection;
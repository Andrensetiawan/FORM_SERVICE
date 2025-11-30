"use client";

import { useEffect, useRef, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { uploadImageToCloudinary } from "@/lib/uploadImage";

type Props = {
  docId: string;
  field: "handover_photo_url" | "pickup_photo_url" | string;
  title: string;
  existingUrl?: string;
  statusLog: any[];
  user: any;
  serviceData: any; 
  setStatus: (v: string) => void;
  setErrorMsg: (v: string | null) => void;
  setSuccessMsg: (v: string | null) => void;
};


export default function PhotoUploadSection({
  docId,
  field,
  title,
  existingUrl,
  statusLog,
  user,
  serviceData,   // ⬅ WAJIB!!!
  setStatus,
  setErrorMsg,
  setSuccessMsg,
}: Props) {

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [streaming, setStreaming] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    existingUrl || null
  );
  const [saving, setSaving] = useState(false);

  // nyalakan kamera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreaming(true);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal mengakses kamera");
    }
  };

  // matikan kamera saat unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((t) => t.stop());
      }
    };
  }, []);

  // ambil foto dari video ke canvas
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    setPreviewUrl(dataUrl);
  };

  // simpan foto ke Cloudinary + Firestore
  const savePhoto = async () => {
    if (!previewUrl) {
      setErrorMsg("Belum ada foto yang diambil");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      // upload ke Cloudinary
        const preset =
          field === "handover_photo_url"
            ? process.env.NEXT_PUBLIC_HANDOVER_PRESET!
            : process.env.NEXT_PUBLIC_PICKUP_PRESET!;

          const url = await uploadImageToCloudinary(previewUrl!, preset);

      // update Firestore
      const ref = doc(db, "service_requests", docId);
      const updatePayload: any = {
        [field]: url,
      };

      // kalau field pickup → ubah status menjadi done + log
      if (field === "pickup_photo_url") {
        const newLog = [
          ...statusLog,
          {
            status: "done",
            updatedBy: user?.email || "unknown",
            updatedAt: new Date(),
            note: "Foto pengambilan diupload",
          },
        ];
        updatePayload.status = "done";
        updatePayload.status_log = newLog;
        setStatus("done");
      }

      await updateDoc(ref, updatePayload);
      setPreviewUrl(url);
      setSuccessMsg("Foto berhasil disimpan");
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal menyimpan foto");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePhoto = async () => {
  if (!serviceData || !serviceData[field]) return;

  try {
    setSaving(true);
    setErrorMsg(null);

    // Hapus URL dari Firestore
    const ref = doc(db, "service_requests", docId);
    await updateDoc(ref, { [field]: "" });

    setPreviewUrl(null);
    setSuccessMsg("Foto berhasil dihapus!");
  } catch (err) {
    console.error(err);
    setErrorMsg("Gagal menghapus foto");
  } finally {
    setSaving(false);
  }
};


  return (
    <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-4 space-y-3 text-white">
      <h2 className="font-semibold text-lg">{title}</h2>

      {/* live camera */}
      <div className="w-full bg-black rounded-lg overflow-hidden flex justify-center items-center">
        <video
          ref={videoRef}
          className="max-h-60 w-full object-contain"
          autoPlay
          muted
        />
      </div>

      {/* preview */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />

      {previewUrl && (
        <div className="mt-2">
          <p className="text-xs text-gray-400 mb-1">Preview:</p>
          <img
            src={previewUrl}
            alt="preview"
            className="border border-gray-700 rounded-lg max-h-40 object-contain bg-black w-full"
          />
        </div>
      )}

      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={startCamera}
          className="flex-1 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 text-sm"
        >
          📷 Nyalakan Kamera
        </button>
        <button
          type="button"
          onClick={takePhoto}
          className="flex-1 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 text-sm"
        >
          📸 Ambil Foto
        </button>
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={savePhoto}
        className="w-full mt-2 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-700 text-sm disabled:opacity-50"
      >
        {saving ? "Menyimpan..." : "💾 Simpan Foto"}
      </button>
      <button
        disabled={saving}
        onClick={handleDeletePhoto}
        className="w-full py-2 bg-red-600 hover:bg-red-700 rounded-lg mt-2 disabled:opacity-50"
      >
        🗑️ Hapus Foto
      </button>

    </div>
  );
}

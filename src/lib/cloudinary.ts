import { MediaItem } from "@/components/tns/types";

// Helper to get Cloudinary preset from field name
export const getPreset = (field: string) => {
    let preset: string | undefined;
    if (field.includes("signature")) preset = process.env.NEXT_PUBLIC_SIGNATURE_PRESET;
    else if (field.includes("unit_work_log")) preset = process.env.NEXT_PUBLIC_TEKNISI_PRESET;
    else if (field.includes("customer_log_media")) preset = process.env.NEXT_PUBLIC_CUSTOMER_LOG_PRESET || process.env.NEXT_PUBLIC_TEKNISI_PRESET; // Fallback to teknisi preset
    else {
      switch (field) {
        case "handover_photo_url": preset = process.env.NEXT_PUBLIC_HANDOVER_PRESET; break;
        case "pickup_photo_url": preset = process.env.NEXT_PUBLIC_PICKUP_PRESET; break;
        case "transfer_proof_url": preset = process.env.NEXT_PUBLIC_PAYMENT_PRESET; break;
      }
    }
    if (!preset) throw new Error(`Preset Cloudinary untuk field "${field}" tidak ditemukan!`);
    return preset;
};

// Helper to upload a single file to Cloudinary
export const uploadToCloudinary = async (item: MediaItem, field: string) => {
    if (!item.file && !item.url.startsWith("data:")) return item.url; // Already uploaded

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = getPreset(field);
    const fd = new FormData();

    if (item.file) {
      fd.append("file", item.file);
    } else if (item.url.startsWith("data:")) {
       const blob = await (await fetch(item.url)).blob();
       fd.append("file", blob, `capture-${Date.now()}.jpg`);
    }

    fd.append("upload_preset", preset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Upload error");
    return data.secure_url as string;
};

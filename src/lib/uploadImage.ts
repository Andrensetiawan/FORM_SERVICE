// src/lib/uploadImage.ts

export async function uploadImageToCloudinary(
  fileOrDataUrl: File | string,
  preset: string
) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) throw new Error("❌ Cloudinary cloud name belum diset");
  if (!preset) throw new Error("❌ Upload preset belum diset!");

  const formData = new FormData();
  formData.append("upload_preset", preset);
  formData.append("file", fileOrDataUrl);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();
  if (!res.ok) {
    console.error("Cloudinary error:", data);
    throw new Error("Gagal upload ke Cloudinary");
  }

  return data.secure_url as string;
}

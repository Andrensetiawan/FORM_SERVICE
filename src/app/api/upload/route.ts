import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      console.error("❌ Tidak ada file dikirim!");
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 🔧 Convert file ke base64 string (bukan stream)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64File = `data:${file.type};base64,${buffer.toString("base64")}`;

    console.log("📤 Mengunggah ke Cloudinary...");
    const result = await cloudinary.uploader.upload(base64File, {
      folder: "avatars",
      resource_type: "image",
    });

    console.log("✅ Cloudinary upload success:", result.secure_url);
    return NextResponse.json({
      success: true,
      secure_url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err: any) {
    console.error("❌ Cloudinary upload error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Upload failed" },
      { status: 500 }
    );
  }
}

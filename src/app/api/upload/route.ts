export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import admin from "@/lib/firebaseAdminConfig";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    // === START: FIREBASE AUTHENTICATION ===
    const authorization = request.headers.get("Authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }
    
    const token = authorization.split("Bearer ")[1];
    
    try {
      await admin.auth().verifyIdToken(token);
    } catch (error) {
      console.error("Firebase auth error:", error);
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }
    // === END: FIREBASE AUTHENTICATION ===

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folderPath = formData.get("folderPath") as string | null;

    if (!file) {
      console.error("❌ Tidak ada file dikirim!");
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 🔧 Convert file ke base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64File = `data:${file.type};base64,${buffer.toString("base64")}`;
    
    console.log("🌥️ Cloudinary Config:", {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? "✅ ada" : "❌ kosong",
    });

    console.log("📤 Uploading to Cloudinary with folder:", folderPath || "default");

    // Generate unique filename dengan timestamp
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name.replace(/\s+/g, '_')}`;

    // Upload dengan folder structure
    const uploadOptions: any = {
      resource_type: "image",
      transformation: [
        { width: 1200, height: 1200, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    };

    // Set folder path jika ada
    if (folderPath) {
      uploadOptions.folder = `service_form/${folderPath}`;
      uploadOptions.public_id = filename;
    } else {
      uploadOptions.folder = "service_form/default";
      uploadOptions.public_id = filename;
    }

    const result = await cloudinary.uploader.upload(base64File, uploadOptions);

    if (!result.secure_url) {
      console.error("🚨 Upload gagal, tidak ada secure_url:", result);
      return NextResponse.json({ error: "Cloudinary upload failed" }, { status: 500 });
    }

    console.log("✅ Cloudinary upload success:", result.secure_url);

    return NextResponse.json({
      success: true,
      secure_url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      size: result.bytes,
      folder: uploadOptions.folder,
    });
  } catch (err: any) {
    console.error("❌ Cloudinary upload error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Upload failed" },
      { status: 500 }
    );
  }
}

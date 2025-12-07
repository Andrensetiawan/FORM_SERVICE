import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return NextResponse.json(
      {
        success: false,
        message: "Konfigurasi Cloudinary tidak lengkap. Pastikan CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET telah diatur di environment variables.",
      },
      { status: 500 }
    );
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });

  try {
    const { public_id } = await req.json();

    if (!public_id) {
      return NextResponse.json(
        { success: false, message: "public_id is required" },
        { status: 400 }
      );
    }

    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result === 'ok') {
      return NextResponse.json({ success: true, result });
    } else if (result.result === 'not found') {
      return NextResponse.json({ success: false, message: 'Image not found on Cloudinary', result }, { status: 404 });
    } else {
      throw new Error(`Cloudinary delete failed with result: ${result.result}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error("Cloudinary delete error:", errorMessage);
    return NextResponse.json(
      {
        success: false,
        message: "Cloudinary delete failed",
        detail: errorMessage,
      },
      { status: 500 }
    );
  }
}

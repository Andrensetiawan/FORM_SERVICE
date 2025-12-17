import { NextResponse } from "next/server";

export async function GET() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  return NextResponse.json({
    exists: !!raw,
    length: raw ? raw.length : 0,
    preview: raw ? raw.substring(0, 80) + " ..." : null
  });
}

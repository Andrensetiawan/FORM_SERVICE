import "@/lib/firebaseAdminConfig";
import admin from "@/lib/firebaseAdminConfig";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({
      ok: true,
      apps_length: admin.apps.length,
      project_id: admin.app().options.projectId,
      has_private_key: !!admin.app().options.credential,
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: String(e),
      apps_length: admin.apps.length
    }, { status: 500 });
  }
}

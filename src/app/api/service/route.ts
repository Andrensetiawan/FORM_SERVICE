import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ambil data dari request
    const { nama, alamat, no_hp, email } = body;

    // TODO: simpan ke database MySQL / SQLite
    // contoh dummy dulu
    console.log("Data masuk:", body);

    return NextResponse.json({
      success: true,
      message: "Data berhasil diterima API",
      data: { nama, alamat, no_hp, email },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

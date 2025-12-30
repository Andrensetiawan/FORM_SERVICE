import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  // Penting: Pastikan FIREBASE_SERVICE_ACCOUNT_KEY di file .env Anda adalah JSON string tunggal.
  // Karakter newline (\n) dalam private_key harus di-escape sebagai \\n (dua backslash).
  // Contoh: "private_key": "-----BEGIN PRIVATE KEY---\\nABCDEF...\\n-----END PRIVATE KEY---\\n"
  if (!raw) {
    console.error("❌ FIREBASE_SERVICE_ACCOUNT_KEY tidak ditemukan di env");
  } else {
    try {
      const serviceAccount = JSON.parse(raw);

      // Convert escaped newlines (\\n) → real newlines (\n)
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log("🔥 Firebase Admin BERHASIL inisialisasi!");
    } catch (err: any) {
      console.error("❌ Gagal initialize Firebase Admin. Raw key status: type:", typeof raw, "length:", raw?.length, "Error:", err);
    }
  }
}

export default admin;

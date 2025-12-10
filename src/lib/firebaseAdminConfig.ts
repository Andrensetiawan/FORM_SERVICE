import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

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
      console.error("❌ Gagal initialize Firebase Admin:", err);
    }
  }
}

export default admin;

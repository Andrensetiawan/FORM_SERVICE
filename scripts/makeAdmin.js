const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const admin = require('firebase-admin');

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin;
  }
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!rawServiceAccount) {
    console.error("❌ Variabel FIREBASE_SERVICE_ACCOUNT_KEY tidak ditemukan di .env.local");
    process.exit(1);
  }
  try {
    const serviceAccount = JSON.parse(rawServiceAccount);
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("🔥 Firebase Admin SDK berhasil diinisialisasi.");
    return admin;
  } catch (error) {
    console.error("❌ Gagal menginisialisasi Firebase Admin SDK:", error);
    process.exit(1);
  }
}

async function grantAdminRole(email) {
  if (!email) {
    console.error("Email diperlukan.");
    return;
  }

  try {
    const adminApp = initializeFirebaseAdmin();
    const auth = adminApp.auth();
    const db = adminApp.firestore();

    console.log(`Mencari pengguna dengan email: ${email}...`);
    const userRecord = await auth.getUserByEmail(email);
    const uid = userRecord.uid;
    console.log(`✅ Pengguna ditemukan. UID: ${uid}`);

    const userDocRef = db.collection('users').doc(uid);
    console.log("Membuat atau memperbarui dokumen pengguna di Firestore (menggunakan .set)...");

    // --- PERUBAHAN DI SINI ---
    // Menggunakan .set({ merge: true }) untuk membuat dokumen jika tidak ada,
    // atau memperbarui jika sudah ada.
    await userDocRef.set({
      role: 'admin',
      approved: true,
    }, { merge: true });

    console.log(`✅ Berhasil membuat/memperbarui dokumen dan memberikan peran 'admin' untuk: ${email}`);

  } catch (error) {
    console.error("❌ Gagal memberikan peran admin:", error.message);
  }
}

const userEmail = "hibatillahcyber@gmail.com";
grantAdminRole(userEmail);
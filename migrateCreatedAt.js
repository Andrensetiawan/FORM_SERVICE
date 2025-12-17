import admin from "firebase-admin";

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

async function migrateCreatedAt() {
  const snap = await db.collection("service_requests").get();

  for (const doc of snap.docs) {
    const data = doc.data();

    // kalau belum ada createdAt tapi ada timestamp
    if (!data.createdAt && data.timestamp) {
      await doc.ref.update({
        createdAt: data.timestamp,
      });

      console.log(`Updated ${doc.id}`);
    }
  }

  console.log("Migration selesai");
}

migrateCreatedAt();

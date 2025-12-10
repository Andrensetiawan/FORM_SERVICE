import admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    const firebaseServiceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!firebaseServiceAccountKey) {
      console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is not defined. Firebase Admin SDK will not be initialized.");
      // This means API routes relying on admin SDK will fail at runtime if the variable is still missing.
    } else {
      const serviceAccount = JSON.parse(firebaseServiceAccountKey as string);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  } catch (error) {
    console.error("Firebase admin initialization error", error);
  }
}

export default admin;

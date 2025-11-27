/**
 * Script: fix_roles.js
 * Purpose: Normalize the `role` field in all documents under the `users` collection.
 * Usage:
 * 1. Create a Firebase service account JSON and save as `scripts/serviceAccountKey.json`
 * 2. Install firebase-admin: `npm install firebase-admin`
 * 3. Run: `node scripts/fix_roles.js`
 *
 * This script will map common typos and set a default role 'user' when missing/unknown.
 */

const admin = require("firebase-admin");
const path = require("path");

const keyPath = path.join(__dirname, "serviceAccountKey.json");

try {
  const serviceAccount = require(keyPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id || undefined,
  });
} catch (err) {
  console.error("Unable to load service account key. Create 'scripts/serviceAccountKey.json' with your Firebase service account.", err.message);
  process.exit(1);
}

const db = admin.firestore();

const VALID_ROLES = ["admin", "manager", "owner", "staff", "user"];

const ROLE_MAP = {
  management: "manager",
  manager: "manager",
  manajer: "manager",
  owner: "owner",
  admin: "admin",
  administrator: "admin",
  staff: "staff",
  staf: "staff",
  user: "user",
  pengguna: "user",
};

async function normalizeRoles() {
  const usersRef = db.collection("users");
  const snapshot = await usersRef.get();
  if (snapshot.empty) {
    console.log("No users found.");
    return;
  }

  let updated = 0;
  let kept = 0;
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const orig = (data.role || "").toString();
    const key = orig.toLowerCase().trim();

    let normalized = null;
    if (VALID_ROLES.includes(key)) {
      normalized = key;
    } else if (ROLE_MAP[key]) {
      normalized = ROLE_MAP[key];
    } else if (!key) {
      normalized = "user";
    } else {
      // Fallback: try to find substring match
      for (const r of VALID_ROLES) {
        if (key.includes(r)) {
          normalized = r;
          break;
        }
      }
    }

    if (!normalized) normalized = "user";

    if (normalized !== orig) {
      await usersRef.doc(docSnap.id).update({ role: normalized });
      updated++;
      console.log(`Updated ${docSnap.id}: '${orig}' -> '${normalized}'`);
    } else {
      kept++;
    }

    // Ensure approved field exists
    if (typeof data.approved === "undefined") {
      await usersRef.doc(docSnap.id).update({ approved: false });
    }
  }

  console.log(`Done. Updated: ${updated}, Kept: ${kept}, Total: ${snapshot.size}`);
}

normalizeRoles()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error normalizing roles:", err);
    process.exit(1);
  });

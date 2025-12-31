import { NextResponse } from "next/server";
import admin from "@/lib/firebaseAdminConfig";
import { ROLES } from "@/lib/roles";

async function verifyAdmin(request: Request): Promise<boolean> {
  const token = request.headers.get("Authorization")?.split("Bearer ")[1];
  if (!token) {
    return false;
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const userDoc = await admin.firestore().collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return false;
    }

    const userRole = userDoc.data()?.role;
    // Allow Admin, Owner, and Manager to access these settings
    return [ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER].includes(userRole);
  } catch (error) {
    console.error("Error verifying admin token:", error);
    return false;
  }
}

export async function GET(request: Request) {
  try {
    const settingsDocRef = admin.firestore().collection("settings").doc("security");
    const docSnap = await settingsDocRef.get();

    if (docSnap.exists) {
      return NextResponse.json(docSnap.data());
    } else {
      // Return default settings if document doesn't exist
      return NextResponse.json({});
    }
  } catch (error) {
    console.error("Error fetching security settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const settings = await request.json();
    const settingsDocRef = admin.firestore().collection("settings").doc("security");
    await settingsDocRef.set(settings);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving security settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

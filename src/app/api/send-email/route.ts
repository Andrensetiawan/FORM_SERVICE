import { NextResponse } from "next/server";
import admin from "@/lib/firebaseAdminConfig";

// This function will verify if the request comes from any authenticated user.
async function verifyUser(request: Request): Promise<boolean> {
  const token = request.headers.get("Authorization")?.split("Bearer ")[1];
  if (!token) {
    return false;
  }

  try {
    // Verifying the token is enough to know they are an authenticated user.
    await admin.auth().verifyIdToken(token);
    return true;
  } catch (error) {
    console.error("Error verifying user token:", error);
    return false;
  }
}

export async function POST(request: Request) {
  const isAuth = await verifyUser(request);
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { to, subject, html } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, html" },
        { status: 400 }
      );
    }

    // --- Mock Email Sending ---
    // In a real application, you would integrate with an email service like SendGrid, Mailgun, or AWS SES here.
    // Example: await sendgrid.send({ to, from: 'noreply@your-app.com', subject, html });

    console.log("====================================");
    console.log("📧 MOCK EMAIL SENT 📧");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("------------------------------------");
    console.log(html);
    console.log("====================================");

    return NextResponse.json({ success: true, message: "Email sent (mocked)." });

  } catch (error) {
    console.error("Error in send-email route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

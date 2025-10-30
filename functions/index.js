import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();

// ------------------------------
// Konfigurasi Email SMTP
// ------------------------------
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const OWNER_EMAIL = process.env.OWNER_EMAIL;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// ------------------------------
// Function: Kirim notifikasi saat staff baru mendaftar
// ------------------------------
export const notifyNewStaff = functions.firestore
  .document("users/{userId}")
  .onCreate(async (snap, context) => {
    const newUser = snap.data();

    if (!newUser) return null;

    // hanya kirim untuk role staff yang belum approved
    if (newUser.role !== "staff" || newUser.approved) return null;

    const mailOptions = {
      from: `"Form Service System" <${EMAIL_USER}>`,
      to: OWNER_EMAIL,
      subject: "🔔 Staff Baru Menunggu Persetujuan",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
          <h2 style="color:#2c3e50;">👋 Notifikasi Staff Baru</h2>
          <p>Seorang staff baru telah mendaftar dan menunggu persetujuan Anda.</p>
          <div style="background:#f9f9f9;padding:10px 15px;border-radius:8px;margin:10px 0;">
            <p><b>Email:</b> ${newUser.email}</p>
            <p><b>UID:</b> ${newUser.uid}</p>
            <p><b>Waktu:</b> ${new Date().toLocaleString("id-ID")}</p>
          </div>
          <p>
            Silakan buka dashboard untuk meninjau dan menyetujui pendaftar:
          </p>
          <a href="https://form-service.web.app/management/pending-users"
             style="background:#2563eb;color:white;padding:10px 20px;border-radius:6px;
                    text-decoration:none;font-weight:600;">
             🔗 Buka Dashboard Approval
          </a>
          <hr style="margin-top:20px;border:none;border-top:1px solid #ddd;">
          <p style="font-size:12px;color:#777;">
            Email ini dikirim otomatis oleh sistem Form Service.
          </p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Notifikasi email terkirim ke ${OWNER_EMAIL}`);
    } catch (error) {
      console.error("❌ Gagal mengirim email:", error);
    }

    return null;
  });

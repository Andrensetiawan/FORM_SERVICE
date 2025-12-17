"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import useAuth from "@/hooks/useAuth";
import { Eye, EyeOff } from "lucide-react";
import { auth, db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { ROLES } from "@/lib/roles";

export default function login() {
  const router = useRouter();
  const { login, register, forgotPassword, resendVerification, refreshVerificationStatus } = useAuth();

  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);

  // ✅ Show/hide password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ✅ Validasi email format
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // ✅ Fungsi utama
  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 🔍 Validasi umum sebelum proses Firebase
    if (!isValidEmail(email)) {
      toast.error("Format email tidak valid.");
      return;
    }

    if (mode !== "forgot" && password.length < 6) {
      toast.error("Password minimal 6 karakter.");
      return;
    }

    if (mode === "register" && password !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const user = await login(email, password);
        if (!user) {
          toast.error("Login gagal. Coba lagi.");
          return;
        }

        if (!user.emailVerified) {
          toast.error("Email belum diverifikasi. Cek inbox atau halaman Verifikasi Email.");
          return;
        }

        const q = query(collection(db, "users"), where("uid", "==", user.uid));
        const snaps = await getDocs(q);

        if (snaps.empty) {
          toast.error("Akun tidak ditemukan di database.");
          return;
        }

        const data = snaps.docs[0].data() as Record<string, any>;
        const role = data.role ?? "";
        const approved = data.approved ?? true;

        if (role === "staff" && !approved) {
          toast.error("Akun kamu belum disetujui oleh Manager atau Admin. Mohon tunggu konfirmasi.");
          return;
        }

        if (role === ROLES.STAFF) {
          router.push("/staff");
        } else if (role === ROLES.MANAGER) {
          router.push("/manager");
        } else if (role === ROLES.OWNER) {
          router.push("/owner");
        } else if (role === ROLES.ADMIN) {
          router.push("/admin");
        } else {
          toast.error("Role tidak dikenali. Hubungi admin.");
          router.push("/");
        }
      } else if (mode === "register") {
        await register(email, password, confirmPassword);
        toast.success("Pendaftaran berhasil! Silakan verifikasi email Anda.");
        // router.push("/verify-email");
      } else if (mode === "forgot") {
        await forgotPassword(email);
        toast.success("Link reset password telah dikirim jika email terdaftar.");
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err?.code === "auth/wrong-password") {
        toast.error("Password salah.");
      } else if (err?.code === "auth/user-not-found") {
        toast.error("Akun tidak ditemukan.");
      } else if (err?.code === "auth/email-already-in-use") {
        toast.error("Email sudah terdaftar.");
      } else {
        toast.error("Terjadi kesalahan. Coba lagi nanti.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Timer untuk resend email verifikasi
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!canResend && countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, canResend]);

  // ✅ Resend email verifikasi
  const handleResend = async () => {
    try {
      if (!auth.currentUser) {
        toast.error("Kamu belum login.");
        return;
      }

      await auth.currentUser.reload();

      if (auth.currentUser.emailVerified) {
        toast.success("Email kamu sudah diverifikasi!");
        return;
      }

      if (!canResend) {
        toast.error(`Tunggu ${countdown}s sebelum kirim ulang.`);
        return;
      }

      await resendVerification();
      toast.success("Email verifikasi telah dikirim. Cek inbox atau folder spam.");
      setCanResend(false);
      setCountdown(30);
    } catch (err: any) {
      console.error("Resend error:", err);
      if (err.code === "auth/too-many-requests") {
        toast.error("Terlalu sering mengirim ulang. Tunggu beberapa menit.");
      } else {
        toast.error("Gagal mengirim email verifikasi.");
      }
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-100 via-indigo-100 to-white min-h-screen flex items-center justify-center">
      <Toaster position="top-center" />
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white/90 shadow-2xl rounded-3xl border border-gray-100 p-10 w-full max-w-md"
      >
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-2">
          {mode === "login"
            ? "Selamat Datang 👋"
            : mode === "register"
            ? "Buat Akun Baru 📝"
            : "Lupa Password 🔑"}
        </h1>

        <p className="text-center text-gray-500 mb-8 text-sm">
          {mode === "login"
            ? "Masuk untuk melanjutkan ke dashboard"
            : mode === "register"
            ? "Daftar untuk akses aplikasi"
            : "Masukkan email untuk reset password"}
        </p>

        <form onSubmit={handleAuth} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              placeholder="Masukkan email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              required
            />
          </div>

          {/* Password */}
          {mode !== "forgot" && (
            <>
              {/* Password utama */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-[65%] -translate-y-1/2 p-1 rounded-full hover:bg-indigo-50 transition"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-600 hover:text-indigo-600 transition" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-600 hover:text-indigo-600 transition" />
                  )}
                </button>
              </div>

              {/* Konfirmasi Password */}
              {mode === "register" && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Ulangi Password</label>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Masukkan ulang password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="absolute right-2 top-[65%] -translate-y-1/2 p-1 rounded-full hover:bg-indigo-50 transition"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-600 hover:text-indigo-600 transition" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-600 hover:text-indigo-600 transition" />
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Tombol utama */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 font-semibold rounded-lg text-white transition-all ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading
              ? "Memproses..."
              : mode === "login"
              ? "Masuk Sekarang"
              : mode === "register"
              ? "Daftar Akun"
              : "Kirim Link Reset"}
          </button>
        </form>

        {/* Tombol tambahan untuk register */}
        {mode === "register" && (
          <>
            <button
              type="button"
              onClick={refreshVerificationStatus}
              className="w-full mt-2 py-2 font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
            >
              Cek Status Verifikasi Email
            </button>

            <button
              type="button"
              disabled={!canResend}
              onClick={handleResend}
              className={`w-full mt-2 py-2 font-semibold rounded-lg text-white transition-all ${
                canResend ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {canResend ? "Kirim Ulang Email Verifikasi" : `Tunggu ${countdown}s`}
            </button>
          </>
        )}

        {/* Footer Mode Switch */}
        <div className="text-center mt-6 space-y-2 text-sm text-gray-600">
          {mode === "login" && (
            <>
              <p>
                Belum punya akun?{" "}
                <button onClick={() => setMode("register")} className="text-indigo-600 hover:underline font-medium">
                  Daftar
                </button>
              </p>
              <p>
                Lupa password?{" "}
                <button onClick={() => setMode("forgot")} className="text-indigo-600 hover:underline font-medium">
                  Reset di sini
                </button>
              </p>
            </>
          )}
          {mode === "register" && (
            <p>
              Sudah punya akun?{" "}
              <button onClick={() => setMode("login")} className="text-indigo-600 hover:underline font-medium">
                Masuk
              </button>
            </p>
          )}
          {mode === "forgot" && (
            <p>
              Kembali ke{" "}
              <button onClick={() => setMode("login")} className="text-indigo-600 hover:underline font-medium">
                Halaman Login
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

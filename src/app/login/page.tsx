"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import useAuth from "@/hooks/useAuth";
import { Eye, EyeOff } from "lucide-react";
import { auth } from "@/lib/firebaseConfig";
import { ROLES, UserRole } from "@/lib/roles";
import { isRoleRequiringApproval } from "@/lib/roleHelpers";

export default function Login() {
  const router = useRouter();
  const {
    user,
    login,
    register,
    forgotPassword,
    resendVerification,
    refreshVerificationStatus,
    signInWithGoogle,
  } = useAuth();

  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [showResend, setShowResend] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect user if already logged in and session is established
  useEffect(() => {
    if (user && user.emailVerified) {
      const role = user.role;
      const approved = user.approved;

      // Redirect pending/unapproved users
      if (role === ROLES.PENDING || (isRoleRequiringApproval(role) && !approved)) {
        toast.error("Akun menunggu persetujuan admin.");
        router.push("/pending-approval");
        return;
      }
      
      toast.success("Login berhasil!");

      // Redirect based on role
      const rolePaths: { [key in UserRole]?: string } = {
        [ROLES.STAFF]: "/staff",
        [ROLES.MANAGER]: "/manager",
        [ROLES.OWNER]: "/owner",
        [ROLES.ADMIN]: "/admin",
      };
      
      const path = rolePaths[role];
      if (path) {
        router.push(path);
      } else {
        toast.error("Role tidak dikenali. Hubungi admin.");
        router.push("/");
      }
    }
  }, [user, router]);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const switchMode = (newMode: "login" | "register" | "forgot") => {
    setMode(newMode);
    setShowResend(false); // Hide resend button on mode switch
    // Keep email and password for user convenience if they mis-clicked
  };

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
    setShowResend(false);

    try {
      if (mode === "login") {
        const loggedInUser = await login(email, password);
        // The `useAuth` hook now returns the user object even if unverified.
        // The `useEffect` above will handle redirection if they are fully verified and approved.
        if (loggedInUser && !loggedInUser.emailVerified) {
          toast.error("Email belum diverifikasi. Klik tombol kirim ulang jika perlu.");
          setShowResend(true); // Show the button to allow resending
        }
      } else if (mode === "register") {
        await register(email, password, confirmPassword);
        toast.success("Pendaftaran berhasil! Silakan verifikasi email Anda.");
        setCanResend(false);
        setCountdown(60);
        // Show options to resend or check status after registration
        setShowResend(true); 
      } else if (mode === "forgot") {
        await forgotPassword(email);
        toast.success("Link reset password telah dikirim jika email terdaftar.");
      }
    } catch (err: any) {
      console.error("Auth error:", err.code, err.message);
      switch (err.code) {
        case "auth/user-not-found":
          toast.error("Akun dengan email ini tidak ditemukan.");
          break;
        case "auth/wrong-password":
          toast.error("Password yang Anda masukkan salah.");
          break;
        case "auth/email-already-in-use":
          toast.error("Email ini sudah terdaftar. Silakan login.");
          break;
        case "auth/user-not-found-in-firestore":
           toast.error("Data pengguna tidak ditemukan di database. Hubungi admin.");
           break;
        default:
          toast.error("Terjadi kesalahan. Coba lagi nanti.");
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Redirection is handled by the main useEffect hook
    } catch (error: any) {
      console.error("Google sign in error", error);
      // Handle popup closed by user gracefully
      if (error?.code === "auth/popup-closed-by-user" || error?.code === "auth/cancelled-popup-request") {
        // User cancelled, no error message needed
        return;
      }
      toast.error(error?.message || "Terjadi kesalahan saat masuk dengan Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!canResend && countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, canResend]);

  const handleResend = async () => {
    if (!canResend) {
      toast.error(`Tunggu ${countdown}s sebelum kirim ulang.`);
      return;
    }
    
    // After a failed login, auth.currentUser is populated by the `login` function.
    if (!auth.currentUser) {
       toast.error("Gagal mendapatkan data user. Coba login kembali.");
       return;
    }
    
    // Reload user data to check latest verification status
    await auth.currentUser.reload();
    if (auth.currentUser.emailVerified) {
      toast.success("Email sudah terverifikasi! Silakan refresh halaman.");
      setShowResend(false);
      return;
    }

    toast.loading("Mengirim ulang email...");
    try {
      await resendVerification();
      toast.dismiss();
      toast.success("Email verifikasi telah dikirim. Cek inbox atau folder spam.");
      setCanResend(false);
      setCountdown(60);
    } catch (err: any) {
      toast.dismiss();
      console.error("Resend error:", err);
      if (err.code === "auth/too-many-requests") {
        toast.error("Terlalu sering mengirim ulang. Tunggu beberapa saat.");
        setCanResend(false);
        setCountdown(60);
      } else {
        toast.error("Gagal mengirim email verifikasi.");
      }
    }
  };

  const handleRefreshStatus = async () => {
    toast.loading("Mengecek status verifikasi...");
    await refreshVerificationStatus();
    // The main useEffect will handle redirection if the user becomes verified and logged in.
    // We can add immediate feedback here too.
    setTimeout(() => {
        toast.dismiss();
        if (auth.currentUser && auth.currentUser.emailVerified) {
            toast.success("Email berhasil diverifikasi! Anda akan dialihkan.");
        } else {
            toast.error("Email masih belum terverifikasi.");
        }
    }, 2000);
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

        <p className="text-center text-gray-500 mb-8 text-base font-bold">
          {mode === "login"
            ? "PT.Alif Cyber Solution"
            : mode === "register"
            ? "Daftar untuk akses aplikasi"
            : "Masukkan email untuk reset password"}
        </p>

        <form onSubmit={handleAuth} className="space-y-5">
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

          {mode !== "forgot" && (
            <>
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
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-600" /> : <Eye className="h-5 w-5 text-gray-600" />}
                </button>
              </div>

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
                    {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-600" /> : <Eye className="h-5 w-5 text-gray-600" />}
                  </button>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 font-semibold rounded-lg text-white transition-all ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? "Memproses..." : (mode === "login" ? "Masuk Sekarang" : mode === "register" ? "Daftar Akun" : "Kirim Link Reset")}
          </button>
        </form>

        {mode === "login" && !showResend && (
          <>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Atau</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className={`w-full py-2 font-semibold rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 transition-all flex items-center justify-center ${
                googleLoading || loading ? "bg-gray-200 cursor-not-allowed" : ""
              }`}
            >
              {googleLoading ? "Memproses..." : (
                 <>
                  <svg className="h-5 w-5 mr-2" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25C22.56 11.45 22.49 10.65 22.36 9.88H12V14.51H18.2C17.96 15.93 17.22 17.14 16.11 17.85V20.53H19.9C21.67 18.98 22.56 16.8 22.56 14.25V12.25Z" fill="#4285F4"/>
                    <path d="M12 23C15.24 23 17.95 21.92 19.9 20.53L16.11 17.85C15.05 18.56 13.62 19 12 19C8.86 19 6.22 16.93 5.34 14.21H1.4V16.99C3.36 20.66 7.33 23 12 23Z" fill="#34A853"/>
                    <path d="M5.34 14.21C5.12 13.56 5 12.78 5 12C5 11.22 5.12 10.44 5.34 9.79V7.01H1.4C0.52 8.74 0 10.3 0 12C0 13.7 0.52 15.26 1.4 16.99L5.34 14.21Z" fill="#FBBC05"/>
                    <path d="M12 5C13.77 5 15.19 5.64 16.27 6.67L20 2.94C17.95 1.18 15.24 0 12 0C7.33 0 3.36 2.34 1.4 6.01L5.34 8.79C6.22 6.07 8.86 4 12 4V5Z" fill="#EA4335"/>
                  </svg>
                  Masuk dengan Google
                </>
              )}
            </button>
          </>
        )}

        {((mode === 'login' || mode === 'register') && showResend) && (
          <div className="mt-4 space-y-2">
             {mode === 'register' && 
                <button
                type="button"
                onClick={handleRefreshStatus}
                className="w-full py-2 font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
                >
                Saya Sudah Verifikasi, Cek Status
                </button>
            }
            <button
              type="button"
              disabled={!canResend || loading}
              onClick={handleResend}
              className={`w-full py-2 font-semibold rounded-lg text-white transition-all ${
                !canResend || loading ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600"
              }`}
            >
              {canResend ? "Kirim Ulang Email Verifikasi" : `Tunggu ${countdown}s`}
            </button>
          </div>
        )}

        <div className="text-center mt-6 space-y-2 text-sm text-gray-600">
          {mode === "login" && (
            <>
              <p>
                Belum punya akun?{" "}
                <button onClick={() => switchMode("register")} className="text-indigo-600 hover:underline font-medium">
                  Daftar
                </button>
              </p>
              <p>
                Lupa password?{" "}
                <button onClick={() => switchMode("forgot")} className="text-indigo-600 hover:underline font-medium">
                  Reset di sini
                </button>
              </p>
            </>
          )}
          {mode === "register" && (
            <p>
              Sudah punya akun?{" "}
              <button onClick={() => switchMode("login")} className="text-indigo-600 hover:underline font-medium">
                Masuk
              </button>
            </p>
          )}
          {mode === "forgot" && (
            <p>
              Kembali ke{" "}
              <button onClick={() => switchMode("login")} className="text-indigo-600 hover:underline font-medium">
                Halaman Login
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

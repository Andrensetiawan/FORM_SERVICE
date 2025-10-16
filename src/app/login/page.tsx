"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar  from "@/components/navbar"

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        router.push("/admin");
      } else if (mode === "register") {
        await createUserWithEmailAndPassword(auth, email, password);
        router.push("/form-service");
      } else if (mode === "forgot") {
        await sendPasswordResetEmail(auth, email);
        setMessage("📧 Email reset password telah dikirim!");
      }
      else if (mode === "register") {
        if (password.length < 6) {
        setError("Password minimal 6 karakter.");
        setLoading(false);
        return;
    }
  await createUserWithEmailAndPassword(auth, email, password);
  router.push("/form-service");
}
    } catch (err: any) {
      if (err.code === "auth/user-not-found") setError("Akun tidak ditemukan.");
      else if (err.code === "auth/wrong-password")
        setError("Password salah.");
      else if (err.code === "auth/email-already-in-use")
        setError("Email sudah terdaftar.");
      else if (err.code === "auth/invalid-email")
        setError("Format email tidak valid.");
      else setError("Terjadi kesalahan, coba lagi.");
      console.log("🔥 Firebase error:", err.code, err.message);
      if (err.code === "auth/user-not-found") setError("Akun tidak ditemukan.");
      else if (err.code === "auth/wrong-password") setError("Password salah.");
      else if (err.code === "auth/email-already-in-use") setError("Email sudah terdaftar.");
      else if (err.code === "auth/invalid-email") setError("Format email tidak valid.");
      else if (err.code === "auth/weak-password") setError("Password terlalu lemah (minimal 6 karakter).");
      else setError("Terjadi kesalahan, coba lagi.");
    } finally {
      setLoading(false);
    }
    
  };

  return (
    <div className="bg-white min-h-screen">
      <Navbar/>
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-100 to-white">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="backdrop-blur-xl bg-white/80 shadow-2xl border border-gray-100 rounded-3xl p-10 w-full max-w-md"
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
            ? "Masuk untuk melanjutkan ke halaman admin"
            : mode === "register"
            ? "Daftar untuk mengakses form service"
            : "Masukkan email untuk reset password"}
        </p>

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="Masukkan email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                        text-gray-800 placeholder-gray-500 
                          focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white/90"
              required
            />
          </div>

          {mode !== "forgot" && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                          text-gray-800 placeholder-gray-500 
                          focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white/90"
                required
              />
            </div>
          )}

          {error && (
            <p className="text-red-500 text-center text-sm bg-red-50 py-2 rounded-lg">
              {error}
            </p>
          )}

          {message && (
            <p className="text-green-600 text-center text-sm bg-green-50 py-2 rounded-lg">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-60"
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

        {/* Switch mode */}
        <div className="text-center mt-6 space-y-2 text-sm text-gray-600">
          {mode === "login" && (
            <>
              <p>
                Belum punya akun?{" "}
                <button
                  onClick={() => setMode("register")}
                  className="text-indigo-600 hover:underline font-medium"
                >
                  Daftar
                </button>
              </p>
              <p>
                Lupa password?{" "}
                <button
                  onClick={() => setMode("forgot")}
                  className="text-indigo-600 hover:underline font-medium"
                >
                  Reset di sini
                </button>
              </p>
            </>
          )}
          {mode === "register" && (
            <p>
              Sudah punya akun?{" "}
              <button
                onClick={() => setMode("login")}
                className="text-indigo-600 hover:underline font-medium"
              >
                Masuk
              </button>
            </p>
          )}
          {mode === "forgot" && (
            <p>
              Kembali ke{" "}
              <button
                onClick={() => setMode("login")}
                className="text-indigo-600 hover:underline font-medium"
              >
                Halaman Login
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
    </div>
  );
}

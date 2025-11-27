'use client'

import { useState } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from "firebase/firestore";

import ProtectedRoute from "../components/ProtectedRoute";
import NavbarSwitcher from "../components/navbars/NavbarSwitcher";
import PhotoUpload from "../components/PhotoUpload";
import { motion } from "framer-motion";

export default function UserPage() {
  const [trackNumber, setTrackNumber] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentImages, setCommentImages] = useState<string[]>([]);

  // ============================================
  // 🔍 SEARCH SERVICE REQUEST
  // ============================================
  const handleSearch = async () => {
    if (!trackNumber.trim()) {
      setError("Masukkan nomor tracking terlebih dahulu");
      return;
    }

    setLoading(true);
    setError("");
    setSearchResult(null);
    setComments([]);

    try {
      const q = query(
        collection(db, "service_requests"),
        where("track_number", "==", trackNumber.trim())
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Nomor tracking tidak ditemukan");
        setLoading(false);
        return;
      }

      const docSnap = querySnapshot.docs[0];
      const data = { id: docSnap.id, ...(docSnap.data() as any) };
      setSearchResult(data);

      // Fetch comments
      const commentsQuery = query(
        collection(db, `service_requests/${docSnap.id}/comments`)
      );

      const commentsSnapshot = await getDocs(commentsQuery);

      const commentsData = commentsSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }))
        .sort(
          (a, b) =>
            (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)
        );

      setComments(commentsData);
    } catch (err) {
      console.error("Error searching:", err);
      setError("Terjadi kesalahan saat mencari data");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // ➕ ADD NEW COMMENT
  // ============================================
  const handleAddComment = async () => {
    if (!newComment.trim() && commentImages.length === 0) {
      setError("Komentar atau gambar harus diisi");
      return;
    }
    if (!searchResult) return;

    try {
      const commentData = {
        text: newComment,
        images: commentImages,
        timestamp: serverTimestamp(),
        addedBy: "customer",
      };

      await addDoc(
        collection(db, `service_requests/${searchResult.id}/comments`),
        commentData
      );

      // Refresh
      const commentsSnapshot = await getDocs(
        collection(db, `service_requests/${searchResult.id}/comments`)
      );

      const commentsData = commentsSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }))
        .sort(
          (a, b) =>
            (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)
        );

      setComments(commentsData);
      setNewComment("");
      setCommentImages([]);
      setError("");
    } catch (err) {
      console.error("Error:", err);
      setError("Gagal menambahkan komentar");
    }
  };

  const handleImageUpload = (url: string) => {
    setCommentImages((prev) => [...prev, url]);
  };

  return (
    <ProtectedRoute allowedRoles={["user"]}>
      <div className="bg-gradient-to-b from-gray-100 to-gray-200 min-h-screen">
        <NavbarSwitcher />

        <main className="max-w-4xl mx-auto p-6 pt-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
          >
            {/* HEADER */}
            <div className="bg-blue-700 text-white px-6 py-5">
              <h1 className="text-2xl font-bold">Cek Status Service</h1>
              <p className="text-blue-100 mt-1">
                Cari dan lacak status service laptop Anda
              </p>
            </div>

            {/* SEARCH */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={trackNumber}
                  onChange={(e) => setTrackNumber(e.target.value)}
                  placeholder="Masukkan nomor tracking Anda"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />

                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
                >
                  {loading ? "Mencari..." : "Cari"}
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
                  {error}
                </div>
              )}
            </div>

            {/* RESULT */}
            {searchResult && (
              <div className="p-6">
                {/* STATUS */}
                <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-lg border">
                  <div>
                    <h3 className="font-medium text-gray-900">Nomor Tracking</h3>
                    <p className="text-lg font-bold text-blue-700">
                      {searchResult.track_number}
                    </p>
                  </div>

                  <span
                    className={`px-4 py-2 text-sm font-semibold rounded-full ${
                      searchResult.status === "Selesai"
                        ? "bg-green-100 text-green-800"
                        : searchResult.status === "Proses"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    Status: {searchResult.status || "Belum Ditentukan"}
                  </span>
                </div>

                {/* DEVICE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="border p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Data Perangkat</h3>
                    <p>Merk: {searchResult.merk || "-"}</p>
                    <p>Tipe: {searchResult.tipe || "-"}</p>
                    <p>Serial: {searchResult.serial_number || "-"}</p>
                    <p>
                      Jenis:{" "}
                      {Array.isArray(searchResult.jenis_perangkat)
                        ? searchResult.jenis_perangkat.join(", ")
                        : searchResult.jenis_perangkat || "-"}
                    </p>
                  </div>

                  <div className="border p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Data Customer</h3>
                    <p>Nama: {searchResult.nama || "-"}</p>
                    <p>No HP: {searchResult.no_hp || "-"}</p>
                    <p>Email: {searchResult.email || "-"}</p>
                  </div>
                </div>

                {/* KELUHAN */}
                <div className="mb-8">
                  <h3 className="font-semibold mb-2">Keluhan</h3>
                  <p className="bg-white p-4 border rounded-lg">
                    {searchResult.keluhan || "-"}
                  </p>
                </div>

                {/* COMMENTS */}
                <h2 className="text-xl font-semibold mb-4">Komentar & Keluhan</h2>

                {/* Add comment */}
                <div className="mb-6 p-4 bg-white border rounded-lg">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Tulis komentar..."
                    rows={3}
                    className="w-full p-3 border rounded-lg mb-3"
                  />

                  <PhotoUpload
                    docId={`comment-${Date.now()}`}
                    folderName="user_comments"
                    label="Upload Foto"
                    onUploadComplete={handleImageUpload}
                  />

                  <button
                    onClick={handleAddComment}
                    className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                  >
                    Tambah Komentar
                  </button>
                </div>

                {/* Display comments */}
                {comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-4 border rounded-lg ${
                          comment.addedBy === "customer"
                            ? "bg-blue-50 border-blue-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        {comment.text && (
                          <p className="mb-2">{comment.text}</p>
                        )}

                        {comment.images?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {comment.images.map((img: string, idx: number) => (
                              <img
                                key={idx}
                                src={img}
                                className="w-24 h-24 object-cover rounded border"
                              />
                            ))}
                          </div>
                        )}

                        <p className="text-xs text-gray-500 mt-2">
                          {comment.timestamp?.seconds
                            ? new Date(
                                comment.timestamp.seconds * 1000
                              ).toLocaleString()
                            : "Waktu tidak tersedia"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-700 italic">Belum ada komentar</p>
                )}
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

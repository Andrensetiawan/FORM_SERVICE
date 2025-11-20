'use client'

import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
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

  // Fetch service request by track number
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
      // Search by track_number field
      const q = query(
        collection(db, "service_requests"),
        where("track_number", "==", trackNumber.trim())
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const data = { id: docSnap.id, ...docSnap.data() };
        setSearchResult(data);

        // Get comments for this service request
        const commentsQuery = query(
          collection(db, `service_requests/${docSnap.id}/comments`)
        );
        const commentsSnapshot = await getDocs(commentsQuery);

        const commentsData = commentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) =>
          (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)
        );

        setComments(commentsData);
      } else {
        setError("Nomor tracking tidak ditemukan");
      }
    } catch (err) {
      console.error("Error searching service request:", err);
      setError("Terjadi kesalahan saat mencari data");
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new comment
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
        addedBy: "customer" // Mark as customer comment
      };

      await addDoc(
        collection(db, `service_requests/${searchResult.id}/comments`),
        commentData
      );

      // Refresh comments
      const commentsQuery = query(
        collection(db, `service_requests/${searchResult.id}/comments`)
      );
      const commentsSnapshot = await getDocs(commentsQuery);

      const commentsData = commentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) =>
        (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)
      );

      setComments(commentsData);
      setNewComment("");
      setCommentImages([]);
      setError("");
    } catch (err) {
      console.error("Error adding comment:", err);
      setError("Gagal menambahkan komentar");
    }
  };

  // Handle image upload for comments
  const handleImageUpload = (url: string) => {
    setCommentImages(prev => [...prev, url]);
  };

  return (
    <ProtectedRoute allowedRoles={["user"]}>
      <div className="bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen">
        <NavbarSwitcher />

        <main className="max-w-4xl mx-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-blue-700 text-white px-6 py-5">
              <h1 className="text-2xl font-bold">Cek Status Service</h1>
              <p className="text-blue-100 mt-1">Cari dan lacak status service laptop Anda</p>
            </div>

            {/* Search Section */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={trackNumber}
                  onChange={(e) => setTrackNumber(e.target.value)}
                  placeholder="Masukkan nomor tracking Anda"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Results Section */}
            {searchResult && (
              <div className="p-6">
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Detail Service Request</h2>

                  {/* Status */}
                  <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <h3 className="font-medium text-gray-700">Nomor Tracking</h3>
                      <p className="text-lg font-bold text-blue-700">{searchResult.track_number}</p>
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

                  {/* Device Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">Data Perangkat</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Merk:</span> {searchResult.merk || "-"}</p>
                        <p><span className="font-medium">Tipe:</span> {searchResult.tipe || "-"}</p>
                        <p><span className="font-medium">Serial Number:</span> {searchResult.serial_number || "-"}</p>
                        <p><span className="font-medium">Jenis Perangkat:</span> {Array.isArray(searchResult.jenis_perangkat) ? searchResult.jenis_perangkat.join(", ") : searchResult.jenis_perangkat || "-"}</p>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">Data Customer</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Nama:</span> {searchResult.nama || "-"}</p>
                        <p><span className="font-medium">No HP:</span> {searchResult.no_hp || "-"}</p>
                        <p><span className="font-medium">Email:</span> {searchResult.email || "-"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Keluhan */}
                  <div className="mb-8">
                    <h3 className="font-semibold text-gray-800 mb-2">Keluhan</h3>
                    <p className="bg-gray-50 p-4 rounded-lg border border-gray-200">{searchResult.keluhan || "-"}</p>
                  </div>
                </div>

                {/* Comments Section */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Komentar dan Keluhan</h2>

                  {/* Add Comment */}
                  <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Tulis komentar atau keluhan Anda..."
                      className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />

                    {/* Image Upload */}
                    <div className="mb-3">
                      <PhotoUpload
                        docId={`comment-${Date.now()}`}
                        folderName="user_comments"
                        label="Upload Foto untuk Komentar"
                        onUploadComplete={(url) => handleImageUpload(url)}
                      />
                    </div>

                    <button
                      onClick={handleAddComment}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      Tambah Komentar
                    </button>
                  </div>

                  {/* Display Comments */}
                  {comments.length > 0 ? (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          className={`p-4 rounded-lg border ${
                            comment.addedBy === "customer"
                              ? "bg-blue-50 border-blue-200"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          {comment.text && (
                            <p className="mb-2 text-gray-800">{comment.text}</p>
                          )}

                          {comment.images && comment.images.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {comment.images.map((img: string, idx: number) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`Comment image ${idx}`}
                                  className="w-24 h-24 object-cover rounded border border-gray-200"
                                />
                              ))}
                            </div>
                          )}

                          <p className="text-xs text-gray-500">
                            {comment.timestamp
                              ? new Date(comment.timestamp.seconds * 1000).toLocaleString()
                              : "Waktu tidak tersedia"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Belum ada komentar</p>
                  )}
                </div>
              </div>
            )}

            {!searchResult && !loading && (
              <div className="p-12 text-center text-gray-500">
                <p>Masukkan nomor tracking untuk melihat status service laptop Anda</p>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

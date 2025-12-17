"use client";
import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import MediaUploadSection, { MediaItem } from './PhotoUploadSection'; // Assuming the refactored component is here
import { uploadToCloudinary } from '@/lib/cloudinary'; // Assuming helpers are exported

type CustomerLogProps = {
    docId: string;
    setErrorMsg: (msg: string | null) => void;
    setSuccessMsg: (msg: string | null) => void;
    className?: string; // Allow external classes
};

interface LogEntry {
    id: string;
    comment: string;
    mediaUrls: string[];
    timestamp: any;
}

export default function CustomerLog({ docId, setErrorMsg, setSuccessMsg, className }: CustomerLogProps) {
    const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
    const [newComment, setNewComment] = useState('');
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch existing log entries
    useEffect(() => {
        const logCollectionRef = collection(db, 'service_requests', docId, 'customer_log');
        const q = query(logCollectionRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const entries: LogEntry[] = [];
            querySnapshot.forEach((doc) => {
                entries.push({ id: doc.id, ...doc.data() } as LogEntry);
            });
            setLogEntries(entries);
        }, (error) => {
            console.error("Error fetching customer log:", error);
            setErrorMsg("Gagal memuat log customer.");
        });

        return () => unsubscribe();
    }, [docId, setErrorMsg]);

    const handleSubmit = async () => {
        if (!newComment.trim() && mediaItems.length === 0) {
            setErrorMsg("Komentar atau lampiran tidak boleh kosong.");
            return;
        }

        setIsSaving(true);
        setErrorMsg(null);

        try {
            // 1. Upload media items
            const uploadedUrls = await Promise.all(
                mediaItems.map(item => uploadToCloudinary(item, 'customer_log_media'))
            );

            // 2. Save log entry to Firestore subcollection
            const logCollectionRef = collection(db, 'service_requests', docId, 'customer_log');
            await addDoc(logCollectionRef, {
                comment: newComment,
                mediaUrls: uploadedUrls,
                timestamp: serverTimestamp(),
            });

            // 3. Clear the form
            setNewComment('');
            setMediaItems([]);
            setSuccessMsg("Komentar dan lampiran berhasil dikirim.");

        } catch (err: any) {
            console.error("Error submitting customer log:", err);
            setErrorMsg("Gagal mengirim komentar: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };
    
    const formatDateTime = (ts: any) => {
        if (ts?.seconds) {
          return new Date(ts.seconds * 1000).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" });
        }
        return "sending...";
    };

    return (
        <section className={`bg-[#0f1c33] border border-blue-900/30 rounded-xl p-6 space-y-5 shadow-lg ${className}`}>
            <h3 className="text-xl font-bold text-green-400 border-b border-blue-900/50 pb-2">
                Keluhan atau Komentar dari Customer
            </h3>

            {/* Form for new comment */}
            <div className="bg-gray-800/50 p-4 rounded-lg">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-600 bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-white mb-3"
                    placeholder="Tulis komentar atau pertanyaan Anda di sini..."
                    disabled={isSaving}
                />
                <MediaUploadSection
                    title="Lampirkan Foto atau Video"
                    items={mediaItems}
                    onItemsChange={setMediaItems}
                    size="small"
                    setErrorMsg={setErrorMsg}
                    showCamera={false} // No live camera for this one
                />
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50"
                    >
                        {isSaving ? "Mengirim..." : "Kirim"}
                    </button>
                </div>
            </div>

            {/* Display existing log entries */}
            <div className="pt-4 border-t border-blue-900/40">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Riwayat Komentar:</h4>
                {logEntries.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">Belum ada komentar.</p>
                ) : (
                    <ul className="space-y-4">
                        {logEntries.map(entry => (
                            <li key={entry.id} className="bg-[#101b33] p-4 rounded-lg">
                                <p className="text-gray-400 text-xs mb-2">{formatDateTime(entry.timestamp)}</p>
                                <p className="text-white whitespace-pre-wrap mb-3">{entry.comment}</p>
                                {entry.mediaUrls && entry.mediaUrls.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {entry.mediaUrls.map((url, index) => (
                                            <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                                               {url.match(/\.(jpeg|jpg|gif|png)$/) != null
                                                ? <img src={url} alt={`Lampiran ${index + 1}`} className="h-24 w-full object-cover rounded-md" />
                                                : <video src={url} className="h-24 w-full object-cover rounded-md bg-black" controls />
                                               }
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}

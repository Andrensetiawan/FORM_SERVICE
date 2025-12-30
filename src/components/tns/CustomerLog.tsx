"use client";
import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import MediaUploadSection, { MediaItem } from './PhotoUploadSection';
import { uploadToCloudinary } from '@/lib/cloudinary';

type CustomerLogProps = {
    docId: string;
    setErrorMsg: (msg: string | null) => void;
    setSuccessMsg: (msg: string | null) => void;
    className?: string;
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
            const uploadedUrls = await Promise.all(
                mediaItems.map(item => uploadToCloudinary(item, 'customer_log_media'))
            );

            const logCollectionRef = collection(db, 'service_requests', docId, 'customer_log');
            await addDoc(logCollectionRef, {
                comment: newComment,
                mediaUrls: uploadedUrls,
                timestamp: serverTimestamp(),
            });

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
        <section className={`space-y-5 ${className}`}>
            <h3 className="text-lg font-semibold text-green-600 border-b border-gray-200 pb-2">
                Keluhan atau Komentar dari Customer
            </h3>

            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-gray-900 mb-3"
                    placeholder="Tulis komentar atau pertanyaan Anda di sini..."
                    disabled={isSaving}
                />
                <MediaUploadSection
                    title="Lampirkan Foto atau Video"
                    items={mediaItems}
                    onItemsChange={setMediaItems}
                    size="small"
                    setErrorMsg={setErrorMsg}
                    showCamera={false}
                />
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {isSaving ? "Mengirim..." : "Kirim"}
                    </button>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-600 mb-3">Riwayat Komentar:</h4>
                {logEntries.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">Belum ada komentar.</p>
                ) : (
                    <ul className="space-y-4">
                        {logEntries.map(entry => (
                            <li key={entry.id} className="border border-gray-200 bg-white p-4 rounded-lg">
                                <p className="text-gray-500 text-xs mb-2">{formatDateTime(entry.timestamp)}</p>
                                <p className="text-gray-800 whitespace-pre-wrap mb-3">{entry.comment}</p>
                                {entry.mediaUrls && entry.mediaUrls.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {entry.mediaUrls.map((url, index) => (
                                            <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                                               {url.match(/\.(jpeg|jpg|gif|png)$/) != null
                                                ? <img src={url} alt={`Lampiran ${index + 1}`} className="h-24 w-full object-cover rounded-md border" />
                                                : <video src={url} className="h-24 w-full object-cover rounded-md bg-gray-100 border" controls />
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

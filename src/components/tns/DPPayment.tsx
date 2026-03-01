"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc, serverTimestamp, addDoc, collection, getDocs, query, orderBy, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import PhotoUploadSection from "./PhotoUploadSection";
import { MediaItem } from "@/components/tns/types";
import { uploadToCloudinary } from "@/lib/cloudinary";
import useAuth from "@/hooks/useAuth";
import { Trash2, X } from "lucide-react";

interface DPPaymentRecord {
    id: string;
    amount: number;
    note?: string;
    proofUrls?: string[];
    createdAt?: any;
    createdBy?: string;
    status?: string;
}

interface Props {
    docId: string;
    totalEstimasi: number;
    currentDp: number;
    buktiTransferPhotoUrl: string[];
    onUpdate: (field: string, urls: string[]) => void;
    setErrorMsg: (msg: string | null) => void;
    setSuccessMsg: (msg: string | null) => void;
    onDpUpdate: (dp: number) => void;
}

export default function DPPayment({ docId, totalEstimasi, currentDp, buktiTransferPhotoUrl, onUpdate, setErrorMsg, setSuccessMsg, onDpUpdate }: Props) {
    const [dpAmount, setDpAmount] = useState(currentDp || 0);
    const [isSaving, setIsSaving] = useState(false);
    const [note, setNote] = useState("");
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [dpPayments, setDpPayments] = useState<DPPaymentRecord[]>([]);
    const [loadingPayments, setLoadingPayments] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const { user, role } = useAuth();
    
    const isAdmin = role === "admin";

    const syncApprovedDp = async (payments: DPPaymentRecord[]) => {
        const approvedDp = payments
            .filter((p) => p.status === 'approved')
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        // Update UI estimasi table immediately
        onDpUpdate(approvedDp);

        // Persist to main document only for internal/authenticated user
        if (user) {
            try {
                await updateDoc(doc(db, 'service_requests', docId), {
                    dp: approvedDp,
                    updatedAt: serverTimestamp(),
                });
            } catch (err) {
                console.warn('Failed to sync approved DP to main document:', err);
            }
        }
    };

    // Load existing DP payments
    useEffect(() => {
        const loadDpPayments = async () => {
            try {
                const q = query(
                    collection(db, 'service_requests', docId, 'dp_payments'),
                    orderBy('createdAt', 'desc')
                );
                const snapshot = await getDocs(q);
                const payments = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as DPPaymentRecord));
                setDpPayments(payments);
                const approvedDp = payments
                    .filter((p) => p.status === 'approved')
                    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                onDpUpdate(approvedDp);
            } catch (err) {
                console.warn("Error loading DP payments:", err);
            } finally {
                setLoadingPayments(false);
            }
        };

        loadDpPayments();
    }, [docId]);

    const handleSaveDP = async () => {
        if (dpAmount < 100000) {
            setErrorMsg("DP minimal 100,000");
            return;
        }
        if (dpAmount > totalEstimasi) {
            setErrorMsg(`DP tidak bisa melebihi total estimasi (Rp ${totalEstimasi.toLocaleString("id-ID")})`);
            return;
        }

        setIsSaving(true);
        try {
            const payload = { dp: dpAmount, updatedAt: serverTimestamp() };
            await updateDoc(doc(db, "service_requests", docId), payload);
            onDpUpdate(dpAmount);
            setSuccessMsg("DP berhasil disimpan!");
        } catch (err) {
            console.error("handleSaveDP error:", err);
            setErrorMsg("Gagal menyimpan DP");
        } finally {
            setIsSaving(false);
        }
    };
    
    const parseNumber = (value: string) => {
        if (!value) return 0;
        const cleaned = value.replace(/[^0-9]/g, "");
        const num = Number(cleaned);
        return num < 0 || isNaN(num) ? 0 : num;
    };

    const handleDeleteDpPayment = async (paymentId: string) => {
        if (!isAdmin) {
            setErrorMsg("Hanya admin yang bisa menghapus pembayaran");
            return;
        }

        if (!confirm("Yakin ingin menghapus pembayaran DP ini?")) {
            return;
        }

        setDeletingId(paymentId);
        try {
            await deleteDoc(doc(db, 'service_requests', docId, 'dp_payments', paymentId));
            const updatedPayments = dpPayments.filter(p => p.id !== paymentId);
            setDpPayments(updatedPayments);
            await syncApprovedDp(updatedPayments);
            setSuccessMsg("Pembayaran DP berhasil dihapus");
        } catch (err: any) {
            console.error("Delete error:", err);
            setErrorMsg("Gagal menghapus pembayaran: " + err.message);
        } finally {
            setDeletingId(null);
        }
    };

    const handleApproveDP = async (paymentId: string) => {
        if (!user) {
            setErrorMsg("Anda harus login");
            return;
        }

        setIsSaving(true);
        try {
            await updateDoc(
                doc(db, 'service_requests', docId, 'dp_payments', paymentId),
                { status: 'approved', approvedBy: user.email, approvedAt: serverTimestamp() }
            );
            const updatedPayments = dpPayments.map(p => p.id === paymentId ? { ...p, status: 'approved' } : p);
            setDpPayments(updatedPayments);
            await syncApprovedDp(updatedPayments);
            setSuccessMsg("DP berhasil diapprove!");
        } catch (err: any) {
            console.error("Approve error:", err);
            setErrorMsg("Gagal approve DP: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRejectDP = async (paymentId: string) => {
        if (!user) {
            setErrorMsg("Anda harus login");
            return;
        }

        setIsSaving(true);
        try {
            await updateDoc(
                doc(db, 'service_requests', docId, 'dp_payments', paymentId),
                { status: 'rejected', rejectedBy: user.email, rejectedAt: serverTimestamp() }
            );
            const updatedPayments = dpPayments.map(p => p.id === paymentId ? { ...p, status: 'rejected' } : p);
            setDpPayments(updatedPayments);
            await syncApprovedDp(updatedPayments);
            setSuccessMsg("DP berhasil ditolak");
        } catch (err: any) {
            console.error("Reject error:", err);
            setErrorMsg("Gagal reject DP: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmitPayment = async () => {
        if (dpAmount < 100000) {
            setErrorMsg("DP minimal 100,000");
            return;
        }
        if (dpAmount > totalEstimasi) {
            setErrorMsg(`DP tidak bisa melebihi total estimasi (Rp ${totalEstimasi.toLocaleString("id-ID")})`);
            return;
        }

        setIsSaving(true);
        setErrorMsg(null);
        try {
            // Upload media items (if any)
            const uploadedUrls: string[] = [];
            if (mediaItems.length > 0) {
                for (const item of mediaItems) {
                    try {
                        const url = await uploadToCloudinary(item, 'transfer_proof_url');
                        uploadedUrls.push(url);
                    } catch (err: any) {
                        console.error("uploadToCloudinary error:", err);
                        setErrorMsg("Gagal mengupload lampiran: " + (err?.message || String(err)));
                        setIsSaving(false);
                        return;
                    }
                }
            }

            // Create a payment record in subcollection
            const paymentEntry = {
                amount: dpAmount,
                note: note || null,
                proofUrls: uploadedUrls,
                createdAt: serverTimestamp(),
                createdBy: user?.email || null,
                status: 'pending',
            } as any;

            await addDoc(collection(db, 'service_requests', docId, 'dp_payments'), paymentEntry);

            // Update main document ONLY jika user adalah internal
            // Public/customer tidak perlu update main document, admin akan approve nanti
            if (user) {
                try {
                    const allProofUrls = [...(buktiTransferPhotoUrl || []), ...uploadedUrls];
                    const payload = { 
                        dp: dpAmount, 
                        transfer_proof_url: allProofUrls, 
                        updatedAt: serverTimestamp() 
                    } as any;
                    await updateDoc(doc(db, 'service_requests', docId), payload);
                    onUpdate?.('transfer_proof_url', allProofUrls);
                } catch (err: any) {
                    console.warn("Update service_requests warning (non-critical):", err?.message);
                }
            }

            setSuccessMsg("Bukti transfer DP berhasil dikirim. Menunggu approval.");
            setNote("");
            setMediaItems([]);
        } catch (err: any) {
            console.error("handleSubmitPayment error:", err);
            setErrorMsg("Gagal mengirim bukti pembayaran: " + (err?.message || String(err)));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="card">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Pembayaran Down Payment (DP)</h3>
            
            {/* Display existing DP payments history */}
            {!loadingPayments && dpPayments.length > 0 && (
                <div className="mb-6 space-y-3">
                    <h4 className="font-semibold text-gray-800">Riwayat Pembayaran DP</h4>
                    {dpPayments.map((payment) => (
                        <div key={payment.id} className={`p-4 border rounded-lg relative w-full max-w-2xl ${
                            payment.status === 'approved' ? 'bg-green-50 border-green-200' :
                            payment.status === 'rejected' ? 'bg-red-50 border-red-200' :
                            'bg-yellow-50 border-yellow-200'
                        }`}>
                            {isAdmin && (
                                <button
                                    onClick={() => handleDeleteDpPayment(payment.id)}
                                    disabled={deletingId === payment.id}
                                    className="absolute top-3 right-3 text-red-500 hover:text-red-700 disabled:opacity-50"
                                    title="Hapus pembayaran"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                            
                            <div className="flex justify-between items-start mb-2 pr-8">
                                <div>
                                    <p className="font-semibold">Rp {(payment.amount || 0).toLocaleString("id-ID")}</p>
                                    <p className="text-xs text-gray-600">
                                        Status: 
                                        <span className={`ml-1 font-semibold ${
                                            payment.status === 'approved' ? 'text-green-700' :
                                            payment.status === 'rejected' ? 'text-red-700' :
                                            'text-yellow-700'
                                        }`}>
                                            {payment.status === 'approved' ? '✓ APPROVED' :
                                             payment.status === 'rejected' ? '✗ REJECTED' :
                                             'PENDING'}
                                        </span>
                                    </p>
                                </div>
                                <span className="text-xs text-gray-500">
                                    {payment.createdAt?.toDate?.()?.toLocaleDateString('id-ID') || ''}
                                </span>
                            </div>
                            
                            {payment.note && (
                                <div className="mb-3 p-2 bg-white rounded border border-gray-200">
                                    <p className="text-xs font-medium text-gray-700">Catatan:</p>
                                    <p className="text-sm text-gray-600">{payment.note}</p>
                                </div>
                            )}
                            
                            {payment.proofUrls && payment.proofUrls.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                                    {payment.proofUrls.map((url, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setPreviewImageUrl(url)}
                                            className="block w-full"
                                            title="Klik untuk lihat foto"
                                        >
                                            <img
                                                src={url}
                                                alt={`Bukti ${idx + 1}`}
                                                className="w-full h-24 object-cover rounded border border-gray-300 cursor-zoom-in hover:opacity-90 transition-opacity"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                            
                            {/* Approve/Reject buttons for internal users */}
                            {user && payment.status === 'pending' && (
                                <div className="flex gap-2 pt-3 border-t border-gray-300">
                                    <button
                                        onClick={() => handleApproveDP(payment.id)}
                                        disabled={isSaving}
                                        className="w-24 px-2 py-0.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded disabled:opacity-50"
                                    >
                                        ✓ Approve
                                    </button>
                                    <button
                                        onClick={() => handleRejectDP(payment.id)}
                                        disabled={isSaving}
                                        className="w-24 px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded disabled:opacity-50"
                                    >
                                        ✗ Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-6">
                <h4 className="text-md font-semibold mb-2">Upload Bukti Transfer DP Baru</h4>
                <PhotoUploadSection
                    title="Foto Bukti Transfer"
                    items={mediaItems}
                    onItemsChange={setMediaItems}
                    size="small"
                    setErrorMsg={setErrorMsg}
                    setSuccessMsg={setSuccessMsg}
                    showCamera={true}
                />

                <div className="mt-3">
                    <label htmlFor="dp-note" className="block text-sm font-medium text-gray-700">Catatan (opsional)</label>
                    <textarea id="dp-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Tulis catatan pembayaran Anda..." className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>
            </div>
            <div className="space-y-4 mt-4">
                <div>
                    <label htmlFor="dp-amount" className="block text-sm font-medium text-gray-700">Jumlah DP</label>
                    <input
                        id="dp-amount"
                        type="text"
                        inputMode="numeric"
                        value={dpAmount.toLocaleString("id-ID")}
                        onChange={(e) => setDpAmount(parseNumber(e.target.value))}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Min: Rp 100.000, Max: Rp {totalEstimasi.toLocaleString("id-ID")}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleSaveDP} 
                        disabled={isSaving}
                        className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
                    >
                        {isSaving ? "Menyimpan..." : "Simpan DP"}
                    </button>

                    <button
                        onClick={handleSubmitPayment}
                        disabled={isSaving || mediaItems.length === 0}
                        className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-50"
                    >
                        {isSaving ? "Mengirim..." : "Kirim Bukti & Simpan DP"}
                    </button>
                </div>
            </div>

            {previewImageUrl && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setPreviewImageUrl(null)}
                >
                    <div
                        className="relative w-full max-w-5xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setPreviewImageUrl(null)}
                            className="absolute -top-3 -right-3 bg-white text-gray-700 rounded-full p-1 shadow hover:bg-gray-100"
                            aria-label="Tutup preview"
                        >
                            <X size={18} />
                        </button>
                        <img
                            src={previewImageUrl}
                            alt="Preview bukti transfer"
                            className="w-full max-h-[85vh] object-contain rounded-lg border border-white/30 bg-black"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

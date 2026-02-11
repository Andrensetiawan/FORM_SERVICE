"use client";

import { useState } from "react";
import { doc, updateDoc, serverTimestamp, addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import PhotoUploadSection, { MediaItem } from "./PhotoUploadSection";
import { uploadToCloudinary } from "@/lib/cloudinary";
import useAuth from "@/hooks/useAuth";

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
    const { user } = useAuth();

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
        try {
            // Upload media items (if any)
            const uploadedUrls: string[] = [];
            for (const item of mediaItems) {
                try {
                    const url = await uploadToCloudinary(item, 'transfer_proof_url');
                    uploadedUrls.push(url);
                } catch (err: any) {
                    console.error("uploadToCloudinary error:", err);
                    setErrorMsg?.("Gagal mengupload lampiran: " + (err?.message || err));
                    setIsSaving(false);
                    return;
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

            await addDoc(collection(db, 'service_requests', docId, 'payments'), paymentEntry);

            // Update main document dp and transfer_proof_url
            const payload = { dp: dpAmount, transfer_proof_url: uploadedUrls.length ? uploadedUrls : buktiTransferPhotoUrl, updatedAt: serverTimestamp() } as any;
            await updateDoc(doc(db, 'service_requests', docId), payload);
            onDpUpdate(dpAmount);
            onUpdate?.('transfer_proof_url', uploadedUrls);
            setSuccessMsg("Bukti transfer dan DP berhasil dikirim.");
            setNote("");
            setMediaItems([]);
        } catch (err) {
            console.error("handleSubmitPayment error:", err);
            setErrorMsg("Gagal mengirim bukti pembayaran.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="card">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Pembayaran Down Payment (DP)</h3>
            <div className="mt-6">
                <h4 className="text-md font-semibold mb-2">Upload Bukti Transfer DP</h4>
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
                    <textarea id="dp-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>
            </div>
            <div className="space-y-4">
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
                        disabled={isSaving}
                        className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-50"
                    >
                        {isSaving ? "Mengirim..." : "Kirim Bukti & Simpan DP"}
                    </button>
                </div>
            </div>
        </div>
    );
}

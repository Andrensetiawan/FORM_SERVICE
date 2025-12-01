"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { uploadImageToCloudinary } from "@/lib/uploadImage";

type Props = {
  docId: string;
  existingSignature?: string;
  statusLog: any[];
  user: any;
  setStatus: (v: string) => void;
  setErrorMsg: (v: string | null) => void;
  setSuccessMsg: (v: string | null) => void;
};

export default function SignatureSection({
  docId,
  existingSignature,
  statusLog,
  user,
  setStatus,
  setErrorMsg,
  setSuccessMsg,
}: Props) {
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const [saving, setSaving] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState(existingSignature || "");

  const saveSignature = async () => {
    if (!signatureRef.current) return;

    try {
      setSaving(true);

      // pakai getTrimmedCanvas supaya pinggir kosong dipotong
      const canvas = signatureRef.current.getTrimmedCanvas();
      const dataUrl = canvas.toDataURL("image/png");

      // upload ke Cloudinary
        const url = await uploadImageToCloudinary(dataUrl, "signatures");



      // update Firestore
      const ref = doc(db, "service_requests", docId);
      const newLog = [
        ...statusLog,
        {
          status: "done",
          updatedBy: user?.email || "unknown",
          updatedAt: new Date(),
          note: "Customer tanda tangan & unit selesai",
        },
      ];

      await updateDoc(ref, {
        customer_signature_url: url,
        status: "done",
        status_log: newLog,
      });

      setStatus("done");
      setSuccessMsg("Berhasil simpan tanda tangan!");
      setErrorMsg(null);
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal menyimpan tanda tangan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-4 space-y-3 text-white">
      <h2 className="font-semibold text-lg">✍️ Tanda Tangan Customer</h2>

      {signatureUrl && (
        <img
          src={signatureUrl}
          alt="signature saved"
          className="border border-gray-600 rounded-lg bg-white w-full max-h-40 object-contain"
        />
      )}

      <SignatureCanvas
        ref={signatureRef}
        penColor="black"
        canvasProps={{
          className:
            "w-full h-40 bg-white rounded-lg border border-gray-600",
        }}
      />

      <div className="flex gap-2">
        <button
          disabled={saving}
          onClick={saveSignature}
          className="flex-1 py-2 bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : "💾 Simpan"}
        </button>

        <button
          type="button"
          onClick={() => signatureRef.current?.clear()}
          className="flex-1 py-2 bg-gray-600 rounded-lg hover:bg-gray-700"
        >
          🔄 Hapus
        </button>
      </div>
    </div>
  );
}

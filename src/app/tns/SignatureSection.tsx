"use client";

import SignatureCanvas from "react-signature-canvas";

interface Props {
  signatureUrl: string;
  saving: boolean;
  signatureRef: any;
  handleClear: () => void;
  handleSave: () => void;
}

export default function SignatureSection({
  signatureUrl,
  saving,
  signatureRef,
  handleClear,
  handleSave,
}: Props) {
  return (
    <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-4 space-y-3">
      <h2 className="font-semibold text-lg">✍️ Tanda Tangan Customer</h2>

      {signatureUrl && (
        <div className="mb-2">
          <p className="text-xs text-gray-400 mb-1">Sudah ada tanda tangan:</p>
          <img
            src={signatureUrl}
            alt="Signature"
            className="border border-gray-700 rounded-lg max-h-44 bg-white"
          />
        </div>
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
          type="button"
          onClick={handleClear}
          className="px-3 py-2 rounded-lg bg-gray-700 text-sm hover:bg-gray-600"
        >
          Hapus
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </div>
  );
}

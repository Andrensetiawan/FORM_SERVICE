"use client";

interface Props {
  type: "handover" | "pickup";
  title: string;
  imageUrl: string;
  saving: boolean;
  handleUpload: (e: React.ChangeEvent<HTMLInputElement>, type: "handover" | "pickup") => void;
}

export default function PhotoUploadSection({
  type,
  title,
  imageUrl,
  saving,
  handleUpload,
}: Props) {
  return (
    <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-4 space-y-3">
      <h2 className="font-semibold text-lg">📸 {title}</h2>

      {imageUrl && (
        <img
          src={imageUrl}
          alt="Foto"
          className="border border-gray-700 rounded-lg max-h-44 object-contain bg-black"
        />
      )}

      <input
        type="file"
        accept="image/*"
        disabled={saving}
        onChange={(e) => handleUpload(e, type)}
        className="text-xs text-gray-300"
      />
    </div>
  );
}

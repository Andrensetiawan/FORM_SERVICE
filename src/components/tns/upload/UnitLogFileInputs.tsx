import React from "react";
import { XCircle, FileText } from "lucide-react";
import { MediaItem } from "@/components/tns/types";

type Props = {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  disabled?: boolean;
  onUpload?: () => void;
  isUploading?: boolean;
};

const ACCEPTED_TYPES = ".jpeg,.jpg,.png,.gif,.pdf,.doc,.docx,.mp4,.mov,.avi,.mkv";

const UnitLogFileInputs: React.FC<Props> = ({ items, onChange, disabled = false, onUpload, isUploading }) => {
  const appendPlaceholder = () => {
    const placeholder: MediaItem = {
      id: `log-file-${Date.now()}`,
      url: "",
      type: "image",
      caption: "",
    };
    onChange([...items, placeholder]);
  };

  const handleFileChange = (itemId: string, file?: File | null) => {
    if (!file) return;
    const updated: MediaItem[] = items.map((item): MediaItem => {
      if (item.id !== itemId) return item;
      if (item.url && item.url.startsWith("blob:")) {
        URL.revokeObjectURL(item.url);
      }
      const mediaType: MediaItem["type"] = file.type.startsWith("video/") ? "video" : "image";
      return {
        ...item,
        file,
        fileName: file.name,
        url: URL.createObjectURL(file),
        type: mediaType,
      };
    });
    onChange(updated);
  };

  const handleCaptionChange = (itemId: string, caption: string) => {
    const updated = items.map((item) => (item.id === itemId ? { ...item, caption } : item));
    onChange(updated);
  };

  const handleRemove = (itemId: string) => {
    const itemToRemove = items.find((item) => item.id === itemId);
    if (itemToRemove?.url && itemToRemove.url.startsWith("blob:")) {
      URL.revokeObjectURL(itemToRemove.url);
    }
    onChange(items.filter((item) => item.id !== itemId));
  };

  const previewItems = items.filter((item) => item.url);

  return (
    <div>
      <div className="mb-5">
        <h4 className="font-bold text-lg text-gray-800">File</h4>
        <p className="text-xs text-gray-500 mt-1 mb-4">
          File yang diijinkan hanya file dengan tipe jpeg, jpg, gif, png, pdf, doc, docx, serta video mp4, mov, avi, mkv
        </p>
        {!disabled && (
          <button
            type="button"
            onClick={appendPlaceholder}
            className="bg-gray-900 hover:bg-black text-white px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition"
          >
            TAMBAH FILE LAINNYA
          </button>
        )}
      </div>

      {items.length === 0 && <p className="text-sm italic text-gray-500">Belum ada file</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className="relative rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow"
                aria-label="Hapus file"
              >
                <XCircle size={16} />
              </button>
            )}
            <p className="text-sm font-semibold text-gray-700 mb-2">Upload File</p>
            <div className="rounded border border-gray-300 overflow-hidden">
              <input
                type="file"
                accept={ACCEPTED_TYPES}
                disabled={disabled}
                className="block w-full px-3 py-2 text-xs text-gray-700 focus:outline-none file:mr-3 file:rounded file:border-0 file:bg-gray-200 file:px-3 file:py-1.5 file:text-gray-700 file:font-semibold file:cursor-pointer"
                onChange={(e) => {
                  handleFileChange(item.id, e.target.files?.[0] ?? null);
                }}
              />
              <div className="border-t border-gray-200 bg-gray-50">
                <input
                  type="text"
                  placeholder="Caption File"
                  value={item.caption || ""}
                  disabled={disabled}
                  className="w-full border-0 bg-transparent px-3 py-2 text-xs text-gray-600 placeholder:text-gray-400 focus:outline-none"
                  onChange={(e) => handleCaptionChange(item.id, e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {previewItems.length > 0 && (
        <div className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {previewItems.map((item) => (
              <div key={`${item.id}-preview`} className="space-y-2 text-center">
                <div className="aspect-[4/3] w-full overflow-hidden rounded border border-gray-200 bg-gray-50">
                  {item.type === "image" ? (
                    <img src={item.url} alt={item.caption || "Lampiran"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-500 text-xs">
                      <FileText size={18} />
                      <span>{item.fileName || "Dokumen"}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-center gap-6 text-xs font-semibold">
                  <a href={item.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    Lihat
                  </a>
                  {!disabled && (
                    <button type="button" onClick={() => handleRemove(item.id)} className="text-red-500 hover:underline">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!disabled && onUpload && (
        <button
          type="button"
          onClick={onUpload}
          disabled={isUploading}
          className="mt-6 inline-flex min-w-[120px] items-center justify-center rounded bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {isUploading ? "Mengunggah..." : "Upload"}
        </button>
      )}

      {disabled && items.length === 0 && (
        <p className="mt-3 text-xs text-gray-500">Tidak ada lampiran untuk log ini.</p>
      )}
    </div>
  );
};

export default UnitLogFileInputs;

import React from "react";
import { User as UserIcon } from "lucide-react";

interface CommentsSectionProps {
  timestamp: number;
  description: string;
  catatanRinci: string;
  canEdit: boolean;
  isSaving: boolean;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  authorName?: string;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({
  timestamp,
  description,
  catatanRinci,
  canEdit,
  isSaving,
  onChange,
  onSubmit,
  authorName,
}) => {
  const displayAuthor = authorName?.trim() || "Catatan Teknis";

  return (
    <div>
      <h4 className="text-xl font-medium text-gray-700 mb-4">Komentar</h4>
      {description && (
        <div className="space-y-4 mb-4">
          <div className="flex gap-3">
            <div className="text-blue-500 mt-1">
              <UserIcon size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-blue-800">{displayAuthor}</span>
                <span className="text-[10px] text-gray-400">{new Date(timestamp).toLocaleString("id-ID")}</span>
              </div>
              <p className="text-sm text-gray-700 mt-1">{description}</p>
            </div>
          </div>
        </div>
      )}

      <div className="border border-gray-300 rounded-md p-1 bg-white max-w-3xl">
        <textarea
          className="w-full p-2 text-sm h-32 outline-none resize-none"
          placeholder="Komentar"
          value={catatanRinci}
          onChange={(e) => onChange(e.target.value)}
          disabled={!canEdit || isSaving}
        />
      </div>
      {canEdit && (
        <button
          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition disabled:opacity-50"
          onClick={onSubmit}
          disabled={isSaving}
        >
          {isSaving ? "Menyimpan..." : "Balas Komentar"}
        </button>
      )}
    </div>
  );
};

export default CommentsSection;

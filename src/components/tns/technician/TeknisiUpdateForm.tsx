import React, { useEffect, useMemo, useRef, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import useAuth from "@/hooks/useAuth";
import { db } from "@/lib/firebaseConfig";
import { UserRole } from "@/lib/roles";
import { createLog } from "@/lib/log";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { MediaItem } from "@/components/tns/types";
import UnitLogFileInputs from "@/components/tns/upload/UnitLogFileInputs";
import { User as UserIcon } from "lucide-react";

interface TeknisiUpdateProps {
  docId: string;
  setErrorMsg: (msg: string | null) => void;
  setSuccessMsg: (msg: string | null) => void;
  canEditUnitLog?: boolean;
  trackNumber?: string;
}
interface UnitWorkLogEntry {
  id: string;
  description: string;
  catatan_rinci: string;
  photo_urls: string[];
  timestamp: number;
  media_items: MediaItem[];
  created_by?: string;
  created_by_name?: string;
}

const pickString = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return undefined;
};

const createDraftEntry = (authorId?: string, authorName?: string): UnitWorkLogEntry => ({
  id: `draft-${Date.now()}`,
  description: "",
  catatan_rinci: "",
  photo_urls: [],
  timestamp: Date.now(),
  media_items: [],
  created_by: authorId,
  created_by_name: authorName,
});

const TeknisiUpdateForm: React.FC<TeknisiUpdateProps> = ({
  docId,
  setErrorMsg,
  setSuccessMsg,
  canEditUnitLog,
  trackNumber,
}) => {
  const { user, role } = useAuth();
  const [unitWorkLog, setUnitWorkLog] = useState<UnitWorkLogEntry[]>([]);
  const [isSavingUnitLog, setIsSavingUnitLog] = useState(false);
  const [draftEntry, setDraftEntry] = useState<UnitWorkLogEntry>(() => createDraftEntry());
  const commentInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UnitWorkLogEntry | null>(null);
  const [deleteMediaTarget, setDeleteMediaTarget] = useState<{ entryId: string; mediaId: string; url?: string } | null>(null);

  useEffect(() => {
    const loadUnitWorkData = async () => {
      if (!docId) {
        return;
      }
      try {
        const docRef = doc(db, "service_requests", docId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return;

        const data = docSnap.data();
        const loadedLog: UnitWorkLogEntry[] = (data.unit_work_log || []).map((entry: any, index: number) => {
          const photoUrls = Array.isArray(entry.photo_urls) ? entry.photo_urls : [];
          const storedMedia = Array.isArray(entry.media_items) ? entry.media_items : [];

          const normalizedMedia: MediaItem[] = storedMedia.length > 0
            ? storedMedia.map((item: any, mediaIdx: number) => ({
                id: item.id || `${entry.id || `log-${index}`}-media-${mediaIdx}`,
                url: item.url || "",
                type: item.type === "video" ? "video" : "image",
                caption: item.caption || "",
              }))
            : photoUrls.map((url: string, mediaIdx: number) => ({
                id: `${entry.id || `log-${index}`}-photo-${mediaIdx}`,
                url,
                type: url.match(/\.(jpeg|jpg|gif|png)$/) ? "image" : "video",
                caption: "",
              }));

          const createdByName =
            pickString(
              entry.created_by_name,
              entry.createdByName,
              entry.authorName,
              entry.author_name,
              entry.teknisi_name,
              entry.teknisi,
              entry.user_name,
              entry.userName,
              entry.by
            ) || undefined;
          const createdBy = pickString(entry.created_by, entry.authorId, entry.uid, entry.teknisi_id, entry.user_id);

          return {
            id: entry.id || `log-${index}-${Date.now()}`,
            description: entry.description || "",
            catatan_rinci: entry.catatan_rinci || "",
            photo_urls: normalizedMedia.map((item) => item.url),
            timestamp: entry.timestamp || Date.now(),
            media_items: normalizedMedia,
            created_by: createdBy,
            created_by_name: createdByName,
          };
        });

        setUnitWorkLog(loadedLog);
      } catch (err) {
        console.error("Error loading unit work data:", err);
        setErrorMsg("Gagal memuat data pengerjaan unit.");
      } finally {
        // no-op
      }
    };

    loadUnitWorkData();
  }, [docId, setErrorMsg]);

  useEffect(() => {
    setDraftEntry((prev) => ({
      ...createDraftEntry(user?.uid, pickString(user?.displayName, user?.email, "Teknisi")),
      catatan_rinci: prev.catatan_rinci,
      media_items: prev.media_items ? prev.media_items.slice() : [],
    }));
  }, [user?.uid, user?.displayName, user?.email]);

  const chronologicalUnitWorkLog = useMemo(() => unitWorkLog.slice().sort((a, b) => a.timestamp - b.timestamp), [unitWorkLog]);
  const photoGalleryItems = useMemo(
    () =>
      unitWorkLog.flatMap((entry) =>
        entry.media_items
          .filter((item) => item.type === "image" && item.url)
          .map((item) => ({
            entryId: entry.id,
            mediaId: item.id,
            url: item.url,
            caption: item.caption,
            timestamp: entry.timestamp,
            author: entry.created_by_name || entry.created_by || "Teknisi",
          }))
      ),
    [unitWorkLog]
  );

  const handleDraftMediaChange = (items: MediaItem[]) => {
    setDraftEntry((prev) => ({ ...prev, media_items: items }));
  };

  const handleDraftCatatanChange = (value: string) => {
    setDraftEntry((prev) => ({ ...prev, catatan_rinci: value }));
  };

  const cleanupDraftMediaUrls = () => {
    draftEntry.media_items.forEach((item) => {
      if (item.url?.startsWith("blob:")) URL.revokeObjectURL(item.url);
    });
  };

  const handleSubmitDraft = async () => {
    if (!user || !docId) {
      setErrorMsg("User not logged in or document ID is missing.");
      return;
    }
    const trimmedNote = draftEntry.catatan_rinci.trim();
    const hasFiles = draftEntry.media_items.some((item) => item.file || item.url);
    if (!trimmedNote && !hasFiles) {
      setErrorMsg("Komentar atau file wajib diisi.");
      return;
    }

    setIsSavingUnitLog(true);
    setErrorMsg(null);
    const entryId = `log-${Date.now()}`;
    try {
      const filteredMedia = draftEntry.media_items
        .filter((item) => item.file || item.url)
        .map((item, idx) => ({
          ...item,
          id: item.id || `${entryId}-media-${idx}`,
        }));

      const uploadedMedia = await Promise.all(
        filteredMedia.map(async (item) => {
          const uploadedUrl = await uploadToCloudinary(item, `unit_work_log_${entryId}`);
          return {
            id: item.id,
            url: uploadedUrl,
            type: item.type === "video" ? "video" : "image",
            caption: item.caption?.trim() || "",
          } as MediaItem;
        })
      );

      const authorName = pickString(draftEntry.created_by_name, user.displayName, user.email, "Teknisi") || "Teknisi";
      const newEntry: UnitWorkLogEntry = {
        id: entryId,
        description: trimmedNote || authorName,
        catatan_rinci: trimmedNote,
        timestamp: Date.now(),
        photo_urls: uploadedMedia.map((item) => item.url),
        media_items: uploadedMedia,
        created_by: user.uid,
        created_by_name: authorName,
      };

      const updatedLog = [...unitWorkLog, newEntry];
      await updateDoc(doc(db, "service_requests", docId), { unit_work_log: updatedLog });
      await createLog({ uid: user.uid, role: role as UserRole, action: "update_unit_work_log", target: docId, detail: { commentId: entryId } });
      setUnitWorkLog(updatedLog);
      setSuccessMsg("Komentar teknisi berhasil dikirim!");
      cleanupDraftMediaUrls();
      const nextAuthorName = pickString(user.displayName, user.email, "Teknisi") || "Teknisi";
      setDraftEntry(createDraftEntry(user.uid, nextAuthorName));
    } catch (err: any) {
      console.error("Error saving unit work log:", err);
      setErrorMsg("Gagal mengirim komentar teknisi: " + err.message);
    } finally {
      setIsSavingUnitLog(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!canEditUnitLog || !deleteTarget) return;
    setIsSavingUnitLog(true);
    try {
      const nextLog = unitWorkLog.filter((entry) => entry.id !== deleteTarget.id);
      await updateDoc(doc(db, "service_requests", docId), { unit_work_log: nextLog });
      setUnitWorkLog(nextLog);
      setSuccessMsg("Komentar berhasil dihapus.");
      setDeleteTarget(null);
    } catch (err: any) {
      console.error("Error deleting unit work log entry:", err);
      setErrorMsg("Gagal menghapus komentar: " + err.message);
    } finally {
      setIsSavingUnitLog(false);
    }
  };

  const handleCancelDelete = () => setDeleteTarget(null);

  const requestDeleteEntry = (entry: UnitWorkLogEntry) => {
    if (!canEditUnitLog) return;
    setDeleteTarget(entry);
  };

  const performRemoveMediaItem = async (entryId: string, mediaId: string) => {
    setIsSavingUnitLog(true);
    try {
      const nextLog = unitWorkLog
        .map((entry) => {
          if (entry.id !== entryId) return entry;
          const nextMedia = entry.media_items.filter((media) => media.id !== mediaId);
          return {
            ...entry,
            media_items: nextMedia,
            photo_urls: nextMedia.map((media) => media.url),
          };
        })
        .filter((entry) => entry.media_items.length > 0 || entry.catatan_rinci.trim());

      await updateDoc(doc(db, "service_requests", docId), { unit_work_log: nextLog });
      setUnitWorkLog(nextLog);
      setSuccessMsg("Lampiran berhasil dihapus.");
    } catch (err: any) {
      console.error("Error deleting media item:", err);
      setErrorMsg("Gagal menghapus lampiran: " + err.message);
    } finally {
      setIsSavingUnitLog(false);
    }
  };

  const requestRemoveMediaItem = (entryId: string, mediaId: string, url?: string) => {
    if (!canEditUnitLog) return;
    setDeleteMediaTarget({ entryId, mediaId, url });
  };

  const handleConfirmRemoveMediaItem = () => {
    if (!deleteMediaTarget) return;
    performRemoveMediaItem(deleteMediaTarget.entryId, deleteMediaTarget.mediaId);
    setDeleteMediaTarget(null);
  };

  const handleCancelRemoveMediaItem = () => setDeleteMediaTarget(null);

  const handleReplyToEntry = (entry: UnitWorkLogEntry) => {
    if (!canEditUnitLog) return;
    const mention = entry.created_by_name ? `@${entry.created_by_name} ` : "";
    if (!mention.trim()) {
      commentInputRef.current?.focus();
      return;
    }
    setDraftEntry((prev) => {
      if (prev.catatan_rinci.startsWith(mention)) return prev;
      const nextValue = prev.catatan_rinci ? `${mention}${prev.catatan_rinci}` : mention;
      return { ...prev, catatan_rinci: nextValue };
    });
    commentInputRef.current?.focus();
  };

  return (
    <>
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm ring-1 ring-gray-100 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Log Pengerjaan Unit</h2>
          <p className="text-sm text-gray-500">Dokumentasi teknisi, foto/video, dan percakapan seputar unit ini.</p>
        </div>
        {trackNumber && (
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-gray-400">Nomor TNS</p>
            <p className="text-base font-bold text-gray-800">{trackNumber}</p>
          </div>
        )}
      </div>
      <div className="p-6 space-y-8">
        {canEditUnitLog && (
          <div className="space-y-4">
            <UnitLogFileInputs
              items={draftEntry.media_items}
              onChange={handleDraftMediaChange}
              disabled={isSavingUnitLog}
              onUpload={handleSubmitDraft}
              isUploading={isSavingUnitLog}
            />
          </div>
        )}

        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800">Galeri Foto</h4>
          {photoGalleryItems.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Belum ada foto yang diunggah.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {photoGalleryItems.map((item, idx) => (
                <div key={`${item.entryId}-${idx}`} className="space-y-2 text-center">
                  <div className="aspect-[4/3] w-full overflow-hidden rounded border border-gray-200 bg-gray-50">
                    <a href={item.url} target="_blank" rel="noreferrer">
                      <img src={item.url} alt={item.caption || "Lampiran"} className="h-full w-full object-cover" />
                    </a>
                  </div>
                  {item.caption && <p className="text-[11px] text-gray-600 line-clamp-2">{item.caption}</p>}
                  <p className="text-[10px] text-gray-400">
                    {item.author} • {new Date(item.timestamp).toLocaleDateString("id-ID")}
                  </p>
                  <div className="flex justify-center gap-4 text-xs font-semibold">
                    <a href={item.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      Lihat
                    </a>
                    {canEditUnitLog && (
                      <button
                        type="button"
                        className="text-red-500 hover:underline"
                        onClick={() => requestRemoveMediaItem(item.entryId, item.mediaId, item.url)}
                        disabled={isSavingUnitLog}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800">Riwayat Komentar</h4>
          {chronologicalUnitWorkLog.length === 0 ? (
            <div className="rounded-md border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              Belum ada percakapan teknisi.
            </div>
          ) : (
            <div className="space-y-4">
              {chronologicalUnitWorkLog.map((entry) => {
                const displayName = entry.created_by_name || entry.created_by || "Teknisi";
                return (
                  <div key={entry.id} className="flex gap-3">
                    <div className="text-blue-500 mt-1">
                      <UserIcon size={18} />
                    </div>
                    <div className="flex-1 border-b border-gray-200 pb-4">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-semibold text-gray-800">{displayName}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "medium" })}
                        </span>
                      </div>
                      {entry.catatan_rinci && <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{entry.catatan_rinci}</p>}

                      {canEditUnitLog && (
                        <div className="mt-2 flex items-center gap-4 text-xs font-semibold">
                          <button className="text-blue-600 hover:underline" onClick={() => handleReplyToEntry(entry)} disabled={isSavingUnitLog}>
                            Balas
                          </button>
                          <button className="text-red-500 hover:underline" onClick={() => requestDeleteEntry(entry)} disabled={isSavingUnitLog}>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {canEditUnitLog && (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-600">Komentar</label>
            <textarea
              ref={commentInputRef}
              className="w-full border border-gray-300 rounded-md p-3 text-sm min-h-[120px] bg-white"
              placeholder="Tulis perkembangan terbaru atau instruksi teknis di sini..."
              value={draftEntry.catatan_rinci}
              onChange={(e) => handleDraftCatatanChange(e.target.value)}
              disabled={isSavingUnitLog}
            />
            <div className="flex justify-end mt-2">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded text-sm font-semibold disabled:opacity-50"
                onClick={handleSubmitDraft}
                disabled={isSavingUnitLog}
              >
                {isSavingUnitLog ? "Mengirim..." : "Balas Komentar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
                !
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Hapus Komentar?</h4>
                <p className="text-sm text-gray-500">Komentar ini akan hilang permanen dari percakapan teknisi.</p>
              </div>
            </div>
            <div className="mt-5 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
              {deleteTarget.catatan_rinci || "(Komentar tanpa teks)"}
            </div>
            <div className="mt-6 flex items-center justify-end gap-3 text-sm font-semibold">
              <button onClick={handleCancelDelete} className="rounded-xl border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50">
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isSavingUnitLog}
                className="rounded-xl bg-red-600 px-4 py-2 text-white shadow hover:bg-red-700 disabled:opacity-60"
              >
                {isSavingUnitLog ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteMediaTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                !
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Hapus Lampiran?</h4>
                <p className="text-sm text-gray-500">Foto akan dihapus dari galeri dan tidak dapat dikembalikan.</p>
              </div>
            </div>
            {deleteMediaTarget.url && (
              <div className="mt-5 rounded-lg border border-gray-100 bg-gray-50 p-3">
                <img src={deleteMediaTarget.url} alt="Pratinjau lampiran" className="h-44 w-full rounded object-cover" />
              </div>
            )}
            <div className="mt-6 flex items-center justify-end gap-3 text-sm font-semibold">
              <button onClick={handleCancelRemoveMediaItem} className="rounded-xl border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50">
                Batal
              </button>
              <button
                onClick={handleConfirmRemoveMediaItem}
                disabled={isSavingUnitLog}
                className="rounded-xl bg-red-600 px-4 py-2 text-white shadow hover:bg-red-700 disabled:opacity-60"
              >
                {isSavingUnitLog ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeknisiUpdateForm;

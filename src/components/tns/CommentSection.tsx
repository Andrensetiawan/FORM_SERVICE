"use client";

import React, { useState } from "react";
import { doc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

type Props = {
  docId: string;
  comments: any[];
  user?: any;
  canComment?: boolean;
  canUploadMedia?: boolean;
  setErrorMsg?: (m: string | null) => void;
  setSuccessMsg?: (m: string | null) => void;
  onCommentsUpdated?: (c: any[]) => void;
};

export default function CommentSection({
  docId,
  comments = [],
  user,
  canComment = true,
  setErrorMsg,
  setSuccessMsg,
  onCommentsUpdated,
}: Props) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      setSending(true);
      const entry = {
        author: user?.email || "anonymous",
        body: text.trim(),
        createdAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "service_requests", docId), {
        comments: arrayUnion(entry),
        updatedAt: serverTimestamp(),
      });

      onCommentsUpdated?.([...comments, entry]);
      setText("");
      setSuccessMsg?.("Komentar terkirim");
    } catch (err) {
      console.error(err);
      setErrorMsg?.("Gagal mengirim komentar");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-lg">
      <h3 className="text-xl font-bold text-red-500">Komentar & Histori Customer</h3>

      <div className="space-y-2">
        {comments?.map((c: any, i: number) => (
          <div key={i} className="bg-gray-100 p-3 rounded">
            <div className="text-xs text-gray-500">{c.author} • {c.createdAt?.seconds ? new Date(c.createdAt.seconds*1000).toLocaleString("id-ID") : "-"}</div>
            <div className="mt-1 text-sm text-gray-800">{c.body}</div>
          </div>
        ))}
      </div>

      {canComment && (
        <div className="mt-3">
          <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full bg-gray-50 border border-gray-300 p-2 rounded" rows={3} placeholder="Tulis balasan atau catatan di sini..." />
          <div className="flex justify-end mt-2">
            <button disabled={sending} onClick={handleSend} className="px-4 py-2 bg-blue-600 text-white rounded">{sending ? "Mengirim..." : "Kirim Komentar"}</button>
          </div>
        </div>
      )}
    </section>
  );
}

"use client";

import React from "react";

type StatusLog = {
  status: string;
  note?: string;
  updatedBy?: string;
  updatedAt?: any;
};

type Props = {
  status: string;
  setStatus: (s: string) => void;
  isSaving: boolean;
  handleUpdateStatus: () => Promise<void>;
  formatDateTime: (ts: any) => string;
  statusLog: StatusLog[];
  isReadOnly?: boolean; // New prop
  className?: string; // Allow external classes
};

export default function StatusControl({
  status,
  setStatus,
  isSaving,
  handleUpdateStatus,
  formatDateTime,
  statusLog,
  isReadOnly = false, // Default to not read-only
  className, // Destructure className
}: Props) {
  return (
    <section className={`bg-[#0f1c33] border border-blue-900/30 rounded-xl p-6 space-y-5 shadow-lg ${className}`}>
      <h3 className="text-xl font-bold text-blue-400 border-b border-blue-900/50 pb-2">
        Status Service
      </h3>

      {!isReadOnly && (
        <>
          <p className="text-sm text-gray-400 -mt-3">Ubah status dan simpan sebagai log:</p>
          <div className="flex justify-between items-center gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={isSaving || isReadOnly}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm w-56 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="pending">1. Diagnosa/Pending</option>
              <option value="process">2. Proses Pengerjaan</option>
              <option value="waiting_approval">3. Menunggu Konfirmasi</option>
              <option value="ready">4. Siap Diambil</option>
              <option value="done">5. Selesai</option>
              <option value="cancel">9. Batal</option>
            </select>

            <button
              disabled={isSaving || isReadOnly}
              onClick={handleUpdateStatus}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Menyimpan..." : "Update"}
            </button>
          </div>
        </>
      )}

      <div className="pt-4 border-t border-blue-900/40">
        <p className="text-sm font-semibold text-gray-300 mb-2">Riwayat Status:</p>

        {!statusLog?.length ? (
          <p className="text-gray-500 text-sm italic">Belum ada log status.</p>
        ) : (
          <div className="max-h-56 overflow-y-auto pr-2">
            <ul className="space-y-3 text-sm">
              {statusLog.slice().reverse().map((log, idx) => (
                <li key={idx} className="bg-[#101b33] border border-blue-900/40 rounded-lg px-4 py-3">
                  <p className="text-gray-400 text-xs mb-1">
                    [{formatDateTime(log.updatedAt)}]
                  </p>

                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold inline-block mb-1
                      ${
                        log.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : log.status === "process"
                          ? "bg-blue-500/20 text-blue-300"
                          : log.status === "ready"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-gray-500/20 text-gray-300"
                      }
                    `}
                  >
                    {log.status}
                  </span>

                  {log.note && <p className="text-gray-300 mt-1">{log.note}</p>}
                  <p className="text-gray-500 text-xs mt-1">Oleh: {log.updatedBy || "-"}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
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
  isReadOnly?: boolean;
  className?: string;
};

const getStatusColor = (status: string = "") => {
  const s = status.toLowerCase().replace(/\s/g, '_'); // Normalize status
  switch (s) {
    case "diterima":
    case "diagnosa":
      return "bg-gray-100 text-gray-800";
    case "menunggu_konfirmasi":
    case "testing":
      return "bg-amber-100 text-amber-800";
    case "proses_pengerjaan":
      return "bg-blue-100 text-blue-800";
    case "siap_diambil":
    case "selesai":
      return "bg-green-100 text-green-800";
    case "batal":
      return "bg-red-100 text-red-800";
    // Fallback for old statuses
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "process":
        return "bg-blue-100 text-blue-800";
    case "ready":
        return "bg-teal-100 text-teal-800";
    case "done":
        return "bg-green-100 text-green-800";
    case "cancel":
        return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
};

export default function StatusControl({
  status,
  setStatus,
  isSaving,
  handleUpdateStatus,
  formatDateTime,
  statusLog,
  isReadOnly = false,
  className,
}: Props) {
  return (
    <section className={`space-y-5 ${className}`}>
      <h3 className="text-lg font-semibold text-blue-600 border-b border-gray-200 pb-2">
        Status Service
      </h3>

      {!isReadOnly && (
        <>
          <p className="text-sm text-gray-600 -mt-3">Ubah status dan simpan sebagai log:</p>
          <div className="flex justify-between items-center gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={isSaving || isReadOnly}
              className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-3 py-2 text-sm w-56 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="diterima">1. Diterima</option>
              <option value="diagnosa">2. Diagnosa</option>
              <option value="menunggu_konfirmasi">3. Menunggu Konfirmasi</option>
              <option value="proses_pengerjaan">4. Proses Pengerjaan</option>
              <option value="testing">5. Testing</option>
              <option value="siap_diambil">6. Siap Diambil</option>
              <option value="selesai">7. Selesai</option>
              <option value="batal">8. Batal</option>
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

      <div className="pt-4 border-t border-gray-200">
        <p className="text-sm font-semibold text-gray-700 mb-2">
          {isReadOnly ? "Status Terakhir:" : "Riwayat Status:"}
        </p>

        {!statusLog?.length ? (
          <p className="text-gray-500 text-sm italic">Belum ada log status.</p>
        ) : isReadOnly ? (
          (() => {
            const latestLog = statusLog.slice().reverse()[0];
            return (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <p className="text-gray-500 text-xs mb-1">
                  [{formatDateTime(latestLog.updatedAt)}]
                </p>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold inline-block mb-1 ${getStatusColor(latestLog.status)}`}
                >
                  {latestLog.status}
                </span>
                {latestLog.note && <p className="text-gray-800 mt-1">{latestLog.note}</p>}
                <p className="text-gray-500 text-xs mt-1">Oleh: {latestLog.updatedBy || "-"}</p>
              </div>
            );
          })()
        ) : (
          <div className="max-h-56 overflow-y-auto pr-2">
            <ul className="space-y-3 text-sm">
              {statusLog.slice().reverse().map((log, idx) => (
                <li key={idx} className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <p className="text-gray-500 text-xs mb-1">
                    [{formatDateTime(log.updatedAt)}]
                  </p>

                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold inline-block mb-1 ${getStatusColor(log.status)}`}
                  >
                    {log.status}
                  </span>

                  {log.note && <p className="text-gray-800 mt-1">{log.note}</p>}
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
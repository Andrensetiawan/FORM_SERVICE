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

const formatStatusLabel = (status: string = "") => status.replace(/_/g, " ").trim() || status;

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
                <p className="text-sm font-semibold text-gray-800">{formatStatusLabel(latestLog.status)}</p>
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
                  <p className="text-sm font-semibold text-gray-800">{formatStatusLabel(log.status)}</p>
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
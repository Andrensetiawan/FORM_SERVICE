"use client";

type Props = {
  status: string;
  setStatus: (s: string) => void;
  isSaving: boolean;
  handleUpdateStatus: () => Promise<void>;
  formatDateTime: (ts: any) => string;
  statusLog: any[];
};

export default function StatusControl({
  status,
  setStatus,
  isSaving,
  handleUpdateStatus,
  formatDateTime,
  statusLog,
}: Props) {
  return (
    <section className="bg-gray-800/70 border border-gray-700 rounded-xl p-4 space-y-4">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h2 className="font-semibold text-lg mb-1">📊 Status Service</h2>
          <p className="text-sm text-gray-400">
            Ubah status dan simpan sebagai log.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm"
          >
            <option value="pending">1. Diagnosa/Pending</option>
            <option value="process">2. Proses Pengerjaan</option>
            <option value="waiting_approval">3. Menunggu Customer</option>
            <option value="ready">4. Siap Diambil</option>
            <option value="done">5. Selesai</option>
            <option value="cancel">9. Batal</option>
          </select>

          <button
            disabled={isSaving}
            onClick={handleUpdateStatus}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm disabled:opacity-50"
          >
            {isSaving ? "Menyimpan..." : "Update"}
          </button>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-3">
        <h3 className="font-semibold text-sm mb-2">Riwayat Status</h3>
        {!statusLog?.length ? (
          <p className="text-gray-400 text-sm">Belum ada log status.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {statusLog
              .slice()
              .reverse()
              .map((log, idx) => (
                <li
                  key={idx}
                  className="flex justify-between border border-gray-700/70 rounded-lg px-3 py-2"
                >
                  <div>
                    <p className="font-semibold">{log.status}</p>
                  </div>

                  <div className="text-right text-xs text-gray-400">
                    <p>{formatDateTime(log.updatedAt)}</p>
                    <p>{log.updatedBy || "-"}</p>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>
    </section>
  );
}

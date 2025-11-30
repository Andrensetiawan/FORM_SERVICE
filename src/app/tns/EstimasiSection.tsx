"use client";

import React from "react";

interface EstimasiItem {
  id: string;
  item: string;
  harga: number;
  qty: number;
  total: number;
}

interface Props {
  estimasiItems: EstimasiItem[];
  totalEstimasi: number;
  isSaving: boolean;
  teknisiNote: string;
  setTeknisiNote: (v: string) => void;
  handleSave: () => void;
  addRow: () => void;
  removeRow: (id: string) => void;
  handleChange: (id: string, field: any, value: string) => void;
}

export default function EstimasiSection({
  estimasiItems,
  totalEstimasi,
  teknisiNote,
  setTeknisiNote,
  handleSave,
  isSaving,
  addRow,
  removeRow,
  handleChange,
}: Props) {
  return (
    <section className="bg-gray-800/70 border border-gray-700 rounded-xl p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-lg">💰 Estimasi Harga</h2>
        <button
          onClick={addRow}
          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs"
        >
          + Tambah Item
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-900/80">
            <tr>
              <th className="p-2 border border-gray-700 text-left">Item</th>
              <th className="p-2 border border-gray-700 text-right">Harga</th>
              <th className="p-2 border border-gray-700 text-right">Qty</th>
              <th className="p-2 border border-gray-700 text-right">Total</th>
              <th className="p-2 border border-gray-700"></th>
            </tr>
          </thead>
          <tbody>
            {estimasiItems.map((r) => (
              <tr key={r.id}>
                <td className="p-2 border border-gray-700">
                  <input
                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm"
                    value={r.item}
                    onChange={(e) => handleChange(r.id, "item", e.target.value)}
                  />
                </td>
                <td className="p-2 border border-gray-700">
                  <input
                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-right"
                    type="number"
                    value={r.harga}
                    onChange={(e) =>
                      handleChange(r.id, "harga", e.target.value)
                    }
                  />
                </td>
                <td className="p-2 border border-gray-700">
                  <input
                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-right"
                    type="number"
                    value={r.qty}
                    onChange={(e) => handleChange(r.id, "qty", e.target.value)}
                  />
                </td>
                <td className="p-2 border border-gray-700 text-right">
                  Rp {r.total.toLocaleString("id-ID")}
                </td>
                <td className="p-2 border border-gray-700 text-center">
                  <button
                    onClick={() => removeRow(r.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="p-2 border border-gray-700 text-right">
                Total:
              </td>
              <td className="p-2 border border-gray-700 text-right font-bold">
                Rp {totalEstimasi.toLocaleString("id-ID")}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div>
        <label className="text-sm">Catatan Teknisi</label>
        <textarea
          rows={3}
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
          value={teknisiNote}
          onChange={(e) => setTeknisiNote(e.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <button
          disabled={isSaving}
          onClick={handleSave}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm disabled:opacity-50"
        >
          {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </section>
  );
}

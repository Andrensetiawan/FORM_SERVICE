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
  dp: number;
  onDpChange?: (value: number) => void;
  handleSave?: () => void;
  isSaving: boolean;
  addRow?: () => void;
  removeRow?: (id: string) => void;
  handleChange?: (
    id: string,
    field: "item" | "harga" | "qty",
    value: string | number
  ) => void;
  isReadOnly?: boolean;
  className?: string;
}

export default function EstimasiSection({
  estimasiItems,
  totalEstimasi,
  dp,
  onDpChange,
  handleSave,
  isSaving,
  addRow,
  removeRow,
  handleChange,
  isReadOnly = false,
  className,
}: Props) {
  const parseNumber = (value: string) => {
    if (!value) return 0;
    const cleaned = value.replace(/[^0-9]/g, "");
    const num = Number(cleaned);
    return num < 0 || isNaN(num) ? 0 : num;
  };

  const finalTotal = totalEstimasi - dp;

  return (
    <section className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-blue-600">Estimasi Biaya</h3>
        {!isReadOnly && (
          <button
            onClick={addRow}
            className="px-3 py-1 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-semibold"
          >
            + Tambah Item
          </button>
        )}
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
              <th className="p-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
              <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              {!isReadOnly && <th className="p-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {estimasiItems.length === 0 && (
              <tr>
                <td colSpan={isReadOnly ? 4 : 5} className="p-4 text-center text-gray-500 italic">
                  Belum ada item estimasi
                </td>
              </tr>
            )}

            {estimasiItems.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="p-2">
                  {isReadOnly ? (
                    <span>{r.item}</span>
                  ) : (
                    <input
                      className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                      value={r.item}
                      onChange={(e) => handleChange?.(r.id, "item", e.target.value)}
                    />
                  )}
                </td>
                <td className="p-2 text-right">
                  {isReadOnly ? (
                    <span>{r.harga.toLocaleString("id-ID")}</span>
                  ) : (
                    <input
                      className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm text-right focus:ring-blue-500 focus:border-blue-500"
                      type="text"
                      inputMode="numeric"
                      value={r.harga.toLocaleString("id-ID")}
                      onChange={(e) => handleChange?.(r.id, "harga", parseNumber(e.target.value))}
                    />
                  )}
                </td>
                <td className="p-2 text-center">
                  {isReadOnly ? (
                     <span>{r.qty}</span>
                  ) : (
                    <input
                      className="w-20 bg-white border border-gray-300 rounded px-2 py-1 text-sm text-center focus:ring-blue-500 focus:border-blue-500"
                      type="text"
                      inputMode="numeric"
                      value={r.qty}
                      onChange={(e) => handleChange?.(r.id, "qty", parseNumber(e.target.value))}
                    />
                  )}
                </td>
                <td className="p-2 text-right font-semibold text-gray-700">
                  Rp {r.total.toLocaleString("id-ID")}
                </td>
                {!isReadOnly && (
                  <td className="p-2 text-center">
                    <button onClick={() => removeRow?.(r.id)} className="text-xs text-red-600 hover:text-red-800">
                      Hapus
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold">
            <tr>
              <td colSpan={3} className="p-3 text-right text-gray-600">Subtotal:</td>
              <td className="p-3 text-right text-gray-800">Rp {totalEstimasi.toLocaleString("id-ID")}</td>
              {!isReadOnly && <td />}
            </tr>
            <tr>
              <td colSpan={3} className="p-3 text-right text-gray-600">DP:</td>
              <td className="p-3 text-right text-red-600">
                {isReadOnly ? (
                  <span>- Rp {dp.toLocaleString("id-ID")}</span>
                ) : (
                  <input
                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm text-right focus:ring-blue-500 focus:border-blue-500"
                    type="text"
                    inputMode="numeric"
                    value={dp.toLocaleString("id-ID")}
                    onChange={(e) => onDpChange?.(parseNumber(e.target.value))}
                  />
                )}
              </td>
              {!isReadOnly && <td />}
            </tr>
            <tr className="border-t-2 border-gray-300">
              <td colSpan={3} className="p-3 text-right text-gray-700 text-base">Total Akhir:</td>
              <td className="p-3 text-right text-green-600 text-base">Rp {finalTotal.toLocaleString("id-ID")}</td>
              {!isReadOnly && <td />}
            </tr>
          </tfoot>
        </table>
      </div>

      {!isReadOnly && (
        <div className="flex justify-end">
          <button disabled={isSaving} onClick={() => handleSave?.()} className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50">
            {isSaving ? "Menyimpan..." : "Simpan Estimasi"}
          </button>
        </div>
      )}
    </section>
  );
}

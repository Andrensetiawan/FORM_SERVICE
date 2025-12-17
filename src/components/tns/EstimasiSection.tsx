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
  isSaving: boolean; // Add this back as required
  addRow?: () => void;
  removeRow?: (id: string) => void;
  handleChange?: (
    id: string,
    field: "item" | "harga" | "qty",
    value: string | number
  ) => void;
  isReadOnly?: boolean; // New prop for read-only mode
  className?: string; // Allow external classes
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
  isReadOnly = false, // Default to false
  className, // Destructure className
}: Props) {
  const parseNumber = (value: string) => {
    if (!value) return 0;
    const cleaned = value.replace(/[^0-9]/g, "");
    const num = Number(cleaned);
    return num < 0 || isNaN(num) ? 0 : num;
  };

  const finalTotal = totalEstimasi - dp;

  return (
    <section className={`bg-[#0f1c33] border border-blue-900/30 rounded-xl p-6 space-y-4 shadow-lg ${className}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-blue-400">Estimasi Harga</h3>
                            <button
                              onClick={addRow} // Only clickable when not readOnly
                              className={`px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold ${isReadOnly ? 'hidden' : ''}`}
                            >          + Tambah Item
                          </button>      </div>

      <div className="overflow-x-auto rounded-lg">
        <table className="w-full text-sm border-collapse bg-[#0c1628]">
          <thead className="bg-[#112240]">
            <tr>
              <th className="p-2 border border-blue-900/40 text-left">Item</th>
              <th className="p-2 border border-blue-900/40 text-right">Harga</th>
              <th className="p-2 border border-blue-900/40 text-right">Qty</th>
              <th className="p-2 border border-blue-900/40 text-right">Total</th>
              {!isReadOnly && <th className="p-2 border border-blue-900/40 text-center">Aksi</th>}
            </tr>
          </thead>

          <tbody>
            {estimasiItems.length === 0 && (
              <tr>
                <td colSpan={5} className="p-3 text-center text-gray-400 italic border border-blue-900/40">
                  Belum ada item estimasi
                </td>
              </tr>
            )}

            {estimasiItems.map((r) => (
              <tr key={r.id} className="border-blue-900/40 border-b">
                <td className="p-2 border border-blue-900/40">
                  <span className={isReadOnly ? 'hidden' : 'block'}>
                    <input
                      className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm"
                      value={r.item}
                      onChange={(e) => handleChange?.(r.id, "item", e.target.value)}
                    />
                  </span>
                  <span className={isReadOnly ? 'block' : 'hidden'}>{r.item}</span>
                </td>

                <td className="p-2 border border-blue-900/40">
                  <span className={isReadOnly ? 'hidden' : 'block'}>
                    <input
                      className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-right"
                      type="text"
                      inputMode="numeric"
                      value={r.harga.toLocaleString("id-ID")}
                      onChange={(e) => handleChange?.(r.id, "harga", parseNumber(e.target.value))}
                    />
                  </span>
                  <span className={isReadOnly ? 'block' : 'hidden'}>{r.harga.toLocaleString("id-ID")}</span>
                </td>

                <td className="p-2 border border-blue-900/40">
                  <span className={isReadOnly ? 'hidden' : 'block'}>
                    <input
                      className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-right"
                      type="text"
                      inputMode="numeric"
                      value={r.qty}
                      onChange={(e) => handleChange?.(r.id, "qty", parseNumber(e.target.value))}
                    />
                  </span>
                  <span className={isReadOnly ? 'block' : 'hidden'}>{r.qty}</span>
                </td>

                <td className="p-2 border border-blue-900/40 text-right font-semibold text-emerald-400">
                  Rp {r.total.toLocaleString("id-ID")}
                </td>

                {isReadOnly ? <td className="p-2 border border-blue-900/40 text-center hidden"></td> :
                <td className="p-2 border border-blue-900/40 text-center">
                  <button onClick={() => removeRow?.(r.id)} className="text-xs text-red-400 hover:text-red-300">
                    Hapus
                  </button>
                </td>}
              </tr>
            ))}
          </tbody>

          <tfoot className="bg-[#112240] font-semibold">
            <tr>
              <td colSpan={3} className="p-2 border border-blue-900/40 text-right">Subtotal:</td>
              <td className="p-2 border border-blue-900/40 text-right text-emerald-400">Rp {totalEstimasi.toLocaleString("id-ID")}</td>
              <td className="border border-blue-900/40"></td>
            </tr>
            <tr>
              <td colSpan={3} className="p-2 border border-blue-900/40 text-right">DP:</td>
              <td className="p-2 border border-blue-900/40 text-right text-red-400">
                <span className={isReadOnly ? 'hidden' : 'block'}>
                  <input
                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-right"
                    type="text"
                    inputMode="numeric"
                    value={dp.toLocaleString("id-ID")}
                    onChange={(e) => onDpChange?.(parseNumber(e.target.value))}
                  />
                </span>
                <span className={isReadOnly ? 'block' : 'hidden'}>{dp.toLocaleString("id-ID")}</span>
              </td>
              <td className="border border-blue-900/40"></td>
            </tr>
            <tr>
              <td colSpan={3} className="p-2 border border-blue-900/40 text-right">Total:</td>
              <td className="p-2 border border-blue-900/40 text-right text-emerald-400">Rp {finalTotal.toLocaleString("id-ID")}</td>
              <td className="border border-blue-900/40"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className={`flex justify-end ${isReadOnly ? 'hidden' : ''}`}>
        <button disabled={isSaving} onClick={() => handleSave?.()} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold disabled:opacity-50">
          {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </section>
  );
}

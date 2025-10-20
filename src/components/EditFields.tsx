// src/components/EditFields.tsx
"use client";

import { useState, useEffect } from "react";

type Props = {
  initial: any;
  onSave: (data: any) => Promise<void>;
  disabled?: boolean;
};

export default function EditFields({ initial, onSave, disabled = false }: Props) {
  const [form, setForm] = useState<any>(initial || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initial || {});
  }, [initial]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const parsed = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm((p: any) => ({ ...p, [name]: parsed }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      alert("✅ Data berhasil diperbarui");
    } catch (err) {
      console.error(err);
      alert("❌ Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const baseInput =
    "w-full p-2.5 rounded-md border border-gray-300 text-gray-800 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors";

  const readonlyInput =
    "bg-gray-100 text-gray-600 cursor-not-allowed";

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* NAMA */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Nama</label>
        <input
          name="nama"
          value={form.nama || ""}
          onChange={handleChange}
          className={`${baseInput} ${disabled ? readonlyInput : "bg-white"}`}
          disabled={disabled}
        />
      </div>

      {/* ALAMAT */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat</label>
        <textarea
          name="alamat"
          value={form.alamat || ""}
          onChange={handleChange}
          className={`${baseInput} ${disabled ? readonlyInput : "bg-white"} resize-none`}
          rows={2}
          disabled={disabled}
        />
      </div>

      {/* GRID 2 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">No HP</label>
          <input
            name="no_hp"
            value={form.no_hp || ""}
            onChange={handleChange}
            className={`${baseInput} ${disabled ? readonlyInput : "bg-white"}`}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
          <input
            name="email"
            value={form.email || ""}
            onChange={handleChange}
            className={`${baseInput} ${disabled ? readonlyInput : "bg-white"}`}
            disabled={disabled}
          />
        </div>
      </div>

      {/* GRID 3 */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Merk</label>
          <input
            name="merk"
            value={form.merk || ""}
            onChange={handleChange}
            className={`${baseInput} ${disabled ? readonlyInput : "bg-white"}`}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Tipe</label>
          <input
            name="tipe"
            value={form.tipe || ""}
            onChange={handleChange}
            className={`${baseInput} ${disabled ? readonlyInput : "bg-white"}`}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Serial Number</label>
          <input
            name="serial_number"
            value={form.serial_number || ""}
            onChange={handleChange}
            className={`${baseInput} ${disabled ? readonlyInput : "bg-white"}`}
            disabled={disabled}
          />
        </div>
      </div>

      {/* KELUHAN */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Keluhan</label>
        <textarea
          name="keluhan"
          value={form.keluhan || ""}
          onChange={handleChange}
          className={`${baseInput} ${disabled ? readonlyInput : "bg-white"} resize-none`}
          rows={3}
          disabled={disabled}
        />
      </div>

      {!disabled && (
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-md shadow-sm transition disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      )}
    </form>
  );
}

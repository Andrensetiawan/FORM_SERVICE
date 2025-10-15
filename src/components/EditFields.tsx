// src/components/EditFields.tsx
"use client";

import { useState } from "react";

type Props = {
  initial: any;
  onSave: (data: any) => Promise<void>;
};

export default function EditFields({ initial, onSave }: Props) {
  const [form, setForm] = useState<any>(initial || {});
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    const parsed = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm((p: any) => ({ ...p, [name]: parsed }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      alert("Data berhasil diperbarui");
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm">Nama</label>
        <input name="nama" value={form.nama || ""} onChange={handleChange} className="w-full p-2 rounded border" />
      </div>

      <div>
        <label className="block text-sm">Alamat</label>
        <textarea name="alamat" value={form.alamat || ""} onChange={handleChange} className="w-full p-2 rounded border" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm">No HP</label>
          <input name="no_hp" value={form.no_hp || ""} onChange={handleChange} className="w-full p-2 rounded border" />
        </div>
        <div>
          <label className="block text-sm">Email</label>
          <input name="email" value={form.email || ""} onChange={handleChange} className="w-full p-2 rounded border" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm">Merk</label>
          <input name="merk" value={form.merk || ""} onChange={handleChange} className="w-full p-2 rounded border" />
        </div>
        <div>
          <label className="block text-sm">Tipe</label>
          <input name="tipe" value={form.tipe || ""} onChange={handleChange} className="w-full p-2 rounded border" />
        </div>
        <div>
          <label className="block text-sm">Serial Number</label>
          <input name="serial_number" value={form.serial_number || ""} onChange={handleChange} className="w-full p-2 rounded border" />
        </div>
      </div>

      <div>
        <label className="block text-sm">Keluhan</label>
        <textarea name="keluhan" value={form.keluhan || ""} onChange={handleChange} className="w-full p-2 rounded border" />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="bg-green-600 px-4 py-2 rounded text-white disabled:opacity-50">Simpan Perubahan</button>
      </div>
    </form>
  );
}

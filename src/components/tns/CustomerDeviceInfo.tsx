"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { Edit, Save, X } from "lucide-react";
import AlignedKeyValue from "./AlignedKeyValue";

type Props = {
  serviceData: any;
  formatDateTime: (ts: any) => string;
  docId: string;
  onUpdate?: (data: any) => void;
  setErrorMsg?: (m: string | null) => void;
  setSuccessMsg?: (m: string | null) => void;
  isReadOnly?: boolean;
};

// Helper for light-theme input fields
const EditInput = ({ label, name, value, onChange, type = "text" }: any) => (
  <div className="flex flex-col mb-2">
    <label className="text-gray-500 text-sm font-medium">{label}:</label>
    {type === "textarea" ? (
      <textarea
        name={name}
        value={value || ""}
        onChange={onChange}
        rows={3}
        className="data-value bg-gray-50 border border-gray-300 text-gray-900 p-2 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        className="data-value bg-gray-50 border border-gray-300 text-gray-900 p-2 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
      />
    )}
  </div>
);

// Reusable component for displaying or editing a data item
const DataItem = ({ label, name, value, onChange, isEditing, type = "text", fallback = "-", isPrintReadOnly = false }: any) => (
  <div className="flex flex-col pb-2 border-b border-gray-200 last:border-b-0">
    {isEditing && !isPrintReadOnly ? (
      <EditInput label={label} name={name} value={value} onChange={onChange} type={type} />
    ) : (
      <AlignedKeyValue label={label} value={value} fallback={fallback} />
    )}
  </div>
);

const maskEmail = (email: string) => {
  if (!email || !email.includes('@')) return email;
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user.slice(0, 1)}*@${domain}`;
  return `${user.slice(0, 2)}********@${domain}`;
};

const maskPhone = (phone: string) => {
  if (!phone || phone.length < 4) return phone;
  return `********${phone.slice(-4)}`;
};

export default function CustomerDeviceInfo({
  serviceData,
  formatDateTime,
  docId,
  onUpdate,
  setErrorMsg,
  setSuccessMsg,
  isReadOnly = false,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState({ ...serviceData });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditableData({ ...serviceData });
  }, [serviceData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditableData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    setErrorMsg?.(null);
    try {
      const docRef = doc(db, "service_requests", docId);
      await updateDoc(docRef, editableData);
      
      onUpdate?.(editableData);
      setSuccessMsg?.("Data berhasil diperbarui!");
      setIsEditing(false);
    } catch (err: any) {
      console.error("Update error:", err);
      setErrorMsg?.("Gagal memperbarui data. " + err.message);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    setEditableData({ ...serviceData });
    setIsEditing(false);
  };

  return (
    <section className="grid md:grid-cols-2 gap-x-6 gap-y-4 relative">
      
      {/* EDIT BUTTON */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 flex gap-2 print:hidden">
        {!isReadOnly && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-lg shadow-md transition-colors"
          >
            <Edit size={14} />
            Ubah Data
          </button>
        )}
        {!isReadOnly && isEditing && (
          <>
            <button
              onClick={handleUpdate}
              disabled={isSaving}
              className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded-lg shadow-md transition-colors"
            >
              {isSaving ? "Menyimpan..." : <><Save size={14} />Simpan</>}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex items-center gap-2 text-sm bg-gray-500 hover:bg-gray-600 text-white font-semibold py-1 px-3 rounded-lg shadow-md transition-colors"
            >
              <X size={14} />
              Batal
            </button>
          </>
        )}
      </div>

      {/* DATA CUSTOMER */}
      <div className="space-y-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-3">
            <h3 className="text-lg font-semibold text-blue-600 border-b border-gray-200 pb-2">Data Customer</h3>
            <DataItem label="Nama" name="nama" value={editableData.nama} onChange={handleChange} isEditing={isEditing} isPrintReadOnly={isReadOnly} fallback={serviceData.nama || "-"} />
            <DataItem label="Prioritas Service" name="prioritas_service" value={editableData.prioritas_service} onChange={handleChange} isEditing={isEditing} isPrintReadOnly={isReadOnly} fallback={serviceData.prioritas_service || "-"} />
            <DataItem label="No HP" name="no_hp" value={isReadOnly ? maskPhone(editableData.no_hp) : editableData.no_hp} onChange={handleChange} isEditing={isEditing} isPrintReadOnly={isReadOnly} fallback={serviceData.no_hp || "-"} />
            <DataItem label="Email" name="email" value={isReadOnly ? maskEmail(editableData.email) : editableData.email} onChange={handleChange} isEditing={isEditing} isPrintReadOnly={isReadOnly} fallback={serviceData.email || "-"} />
            <DataItem label="Alamat" name="alamat" value={editableData.alamat} onChange={handleChange} isEditing={isEditing} isPrintReadOnly={isReadOnly} type="textarea" fallback={serviceData.alamat || "-"} />
            <DataItem label="Penerima Service" name="penerima_service" value={editableData.penerima_service} onChange={handleChange} isEditing={isEditing} isPrintReadOnly={isReadOnly} fallback={serviceData.penerima_service || "-"} />
            <DataItem label="Tanggal Masuk" value={formatDateTime(serviceData.timestamp)} isEditing={false} isPrintReadOnly={isReadOnly} />
        </div>

        <div className="space-y-3 border border-gray-200 rounded-lg p-4 bg-white">
          <h3 className="text-lg font-semibold text-blue-600 border-b border-gray-200 pb-2">Jenis Perangkat</h3>
          {isEditing ? (
            <DataItem label="Jenis Perangkat" name="jenis_perangkat" value={Array.isArray(editableData.jenis_perangkat) ? editableData.jenis_perangkat.join(", ") : editableData.jenis_perangkat} onChange={handleChange} isEditing={true} isPrintReadOnly={isReadOnly} type="textarea" fallback={""} />
          ) : (
            <DataItem label="Jenis Perangkat" value={Array.isArray(serviceData.jenis_perangkat) ? serviceData.jenis_perangkat.join(", ") : serviceData.jenis_perangkat} isEditing={false} fallback={"-"} />
          )}
          <DataItem label="Keterangan Perangkat" name="keterangan_perangkat" value={editableData.keterangan_perangkat} onChange={handleChange} isEditing={isEditing} isPrintReadOnly={isReadOnly} type="textarea" fallback={serviceData.keterangan_perangkat || "-"} />
        </div>

        <div className="space-y-3 border border-gray-200 rounded-lg p-4 bg-white">
          <h3 className="text-lg font-semibold text-blue-600 border-b border-gray-200 pb-2">Kondisi Saat Masuk</h3>
          {isEditing ? (
            <DataItem label="Kondisi" name="kondisi" value={Array.isArray(editableData.kondisi) ? editableData.kondisi.join(", ") : editableData.kondisi} onChange={handleChange} isEditing={true} isPrintReadOnly={isReadOnly} type="textarea" fallback={""} />
          ) : (
            <DataItem label="Kondisi" value={Array.isArray(serviceData.kondisi) ? serviceData.kondisi.join(", ") : serviceData.kondisi} isEditing={false} fallback={"-"} />
          )}
          <DataItem label="Keterangan Kondisi" name="keterangan_kondisi" value={editableData.keterangan_kondisi} onChange={handleChange} isEditing={isEditing} isPrintReadOnly={isReadOnly} type="textarea" fallback={serviceData.keterangan_kondisi || "-"} />
        </div>
      </div>

      {/* DATA PERANGKAT */}
      <div className="space-y-4">
        <div className="space-y-3 border border-gray-200 rounded-lg p-4 bg-white">
          <h3 className="text-lg font-semibold text-blue-600 border-b border-gray-200 pb-2">Data Perangkat</h3>
          <DataItem label="Merk" name="merk" value={editableData.merk} onChange={handleChange} isEditing={isEditing} isPrintReadOnly={isReadOnly} fallback={serviceData.merk || "-"} />
          <DataItem label="Tipe" name="tipe" value={editableData.tipe} onChange={handleChange} isEditing={isEditing} isPrintReadOnly={isReadOnly} fallback={serviceData.tipe || "-"} />
          <DataItem label="Serial Number" name="serial_number" value={editableData.serial_number} onChange={handleChange} isEditing={isEditing} isPrintReadOnly={isReadOnly} fallback={serviceData.serial_number || "-"} />
          <DataItem label="Keluhan" name="keluhan" value={editableData.keluhan} onChange={handleChange} isEditing={isEditing} isPrintReadOnly={isReadOnly} type="textarea" fallback={serviceData.keluhan || "-"} />
          <DataItem label="Spesifikasi Tambahan" name="spesifikasi_teknis" value={editableData.spesifikasi_teknis} onChange={handleChange} isEditing={isEditing} isPrintReadOnly={isReadOnly} type="textarea" fallback={serviceData.spesifikasi_teknis || "-"} />
          {isEditing ? (
            <DataItem label="Garansi" name="garansi" value={editableData.garansi ? "Masih Garansi" : "Habis / Tidak Ada"} onChange={handleChange} isEditing={true} isPrintReadOnly={isReadOnly} fallback={""} />
          ) : (
            <DataItem label="Garansi" value={serviceData.garansi ? "Masih Garansi" : "Habis / Tidak Ada"} isEditing={false} fallback={"Habis / Tidak Ada"} />
          )}
          <p className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
              <span className="text-gray-600 font-medium">Biaya Perbaikan Total:</span>
              <span className="text-green-600 font-bold">Rp {Number(serviceData.total_biaya || 0).toLocaleString("id-ID")}</span>
          </p>
        </div>

        <div className="space-y-3 border border-gray-200 rounded-lg p-4 bg-white">
          <h3 className="text-lg font-semibold text-blue-600 border-b border-gray-200 pb-2">Accessories</h3>
          {isEditing ? (
            <DataItem label="Accessories" name="accessories" value={Array.isArray(editableData.accessories) ? editableData.accessories.join(", ") : editableData.accessories} onChange={handleChange} isEditing={true} isPrintReadOnly={isReadOnly} type="textarea" fallback={""} />
          ) : (
            <DataItem label="Accessories" value={Array.isArray(serviceData.accessories) ? serviceData.accessories.join(", ") : serviceData.accessories} isEditing={false} fallback={"-"} />
          )}
          <DataItem label="Keterangan Accessories" name="keterangan_accessories" value={editableData.keterangan_accessories} onChange={handleChange} isEditing={isEditing} isPrintReadOnly={isReadOnly} type="textarea" fallback={serviceData.keterangan_accessories || "-"} />
        </div>
      </div>

    </section>
  );
}
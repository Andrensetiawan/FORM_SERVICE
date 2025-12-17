"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { Edit, Save, X, Printer } from "lucide-react";
import AlignedKeyValue from "./AlignedKeyValue"; // Import the new component

type Props = {
  serviceData: any;
  formatDateTime: (ts: any) => string;
  docId: string;
  onUpdate?: (data: any) => void;
  setErrorMsg?: (m: string | null) => void;
  setSuccessMsg?: (m: string | null) => void;
  isReadOnly?: boolean; // New prop
};

// Helper component for input fields
const EditInput = ({ label, name, value, onChange, type = "text" }: any) => (
  <div className="flex flex-col mb-2">
    <label className="text-gray-400 text-sm font-medium">{label}:</label>
    {type === "textarea" ? (
      <textarea
        name={name}
        value={value || ""}
        onChange={onChange}
        rows={3}
        className="data-value bg-blue-900/50 p-2 rounded-md w-full text-white"
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        className="data-value bg-blue-900/50 p-2 rounded-md w-full text-white"
      />
    )}
  </div>
);

// Reusable component for displaying or editing a data item
const DataItem = ({ label, name, value, onChange, isEditing, type = "text", fallback = "-", isPrintReadOnly = false }: any) => (
  <div className="flex flex-col pb-2 border-b border-gray-700/30 last:border-b-0">
    {isEditing && !isPrintReadOnly ? (
      <EditInput label={label} name={name} value={value} onChange={onChange} type={type} />
    ) : (
      <AlignedKeyValue label={label} value={value} fallback={fallback} />
    )}
  </div>
);

export default function CustomerDeviceInfo({
  serviceData,
  formatDateTime,
  docId,
  onUpdate,
  setErrorMsg,
  setSuccessMsg,
  isReadOnly = false, // Default to not read-only
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState({
    ...serviceData,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditableData({
      ...serviceData,
    });
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
      
      onUpdate?.(editableData); // Update parent state
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
    setEditableData({ ...serviceData }); // Revert changes
    setIsEditing(false);
    };

  const handlePrint = () => {
    window.print();
  };

    return (
      <section className="grid md:grid-cols-2 gap-6 relative">
      
      {/* EDIT BUTTON - now conditional */}
      <div className="absolute top-0 right-0 mt-4 mr-4 flex gap-2 print:hidden">
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
          <> {/* Use a fragment to group buttons */}
            <button
              onClick={handleUpdate}
              disabled={isSaving}
              className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded-lg shadow-md transition-colors"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin text-xl">⏳</span>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Simpan</span>
                </>
              )}
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
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 text-sm bg-gray-600 hover:bg-gray-700 text-white font-semibold py-1 px-3 rounded-lg shadow-md transition-colors"
        >
          <Printer size={14} />
          Cetak/Unduh
        </button>
      </div>

      {/* ============================
          DATA CUSTOMER
      ============================= */}
      <div className="bg-[#0f1c33] p-6 rounded-xl space-y-3 shadow-lg border border-blue-900/30">
        <h3 className="text-xl font-bold text-yellow-400 border-b border-blue-900/50 pb-2">Data Customer</h3>

        <DataItem label="Nama" name="nama" value={editableData.nama} onChange={handleChange} isEditing={isEditing} isPrintReadOnly={isReadOnly} fallback={serviceData.nama || "-"} />
        <DataItem label="No HP" name="no_hp" value={editableData.no_hp} onChange={handleChange} isEditing={isEditing} isPrintReadOnly={isReadOnly} fallback={serviceData.no_hp || "-"} />
        <DataItem label="Email" name="email" value={editableData.email} onChange={handleChange} isEditing={isEditing} isPrintReadOnly={isReadOnly} fallback={serviceData.email || "-"} />
        <DataItem label="Alamat" name="alamat" value={editableData.alamat} onChange={handleChange} isEditing={isEditing} isPrintReadOnly={isReadOnly} type="textarea" fallback={serviceData.alamat || "-"} />
        <DataItem label="Penerima Service" name="penerima_service" value={editableData.penerima_service} onChange={handleChange} isEditing={isEditing} isPrintReadOnly={isReadOnly} fallback={serviceData.penerima_service || "-"} />
        <DataItem label="Tanggal Masuk" value={formatDateTime(serviceData.timestamp)} isEditing={false} isPrintReadOnly={isReadOnly} />
      </div>

      {/* ============================
          DATA PERANGKAT
      ============================= */}
      <div className="bg-[#0f1c33] p-6 rounded-xl space-y-3 shadow-lg border border-blue-900/30">
        <h3 className="text-xl font-bold text-yellow-400 border-b border-blue-900/50 pb-2">Data Perangkat</h3>
                <DataItem label="Merk" name="merk" value={editableData.merk} onChange={handleChange} isEditing={isEditing} isPrintReadOnly={isReadOnly} fallback={serviceData.merk || "-"} />
                <DataItem label="Tipe" name="tipe" value={editableData.tipe} onChange={handleChange} isEditing={isEditing} isPrintReadOnly={isReadOnly} fallback={serviceData.tipe || "-"} />
                <DataItem label="Serial Number" name="serial_number" value={editableData.serial_number} onChange={handleChange} isEditing={isEditing} isPrintReadOnly={isReadOnly} fallback={serviceData.serial_number || "-"} />
                <DataItem label="Keluhan" name="keluhan" value={editableData.keluhan} onChange={handleChange} isEditing={isEditing} isPrintReadOnly={isReadOnly} type="textarea" fallback={serviceData.keluhan || "-"} />
                
                {/* Kondisi - Special handling for array or string */}
                {isEditing ? (
                  <DataItem label="Kondisi" name="kondisi" value={Array.isArray(editableData.kondisi) ? editableData.kondisi.join(", ") : editableData.kondisi} onChange={handleChange} isEditing={true} isPrintReadOnly={isReadOnly} type="textarea" fallback={""} />
                ) : (
                  <DataItem label="Kondisi" value={Array.isArray(serviceData.kondisi) ? serviceData.kondisi.join(", ") : serviceData.kondisi} isEditing={false} fallback={"-"} />
                )}
        
                <DataItem label="Spesifikasi Tambahan" name="spesifikasi_teknis" value={editableData.spesifikasi_teknis} onChange={handleChange} isEditing={isEditing} isPrintReadOnly={isReadOnly} type="textarea" fallback={serviceData.spesifikasi_teknis || "-"} />
                
                {/* Garansi - Special handling for boolean */}
                {isEditing ? (
                  <DataItem label="Garansi" name="garansi" value={editableData.garansi ? "Masih Garansi" : "Habis / Tidak Ada"} onChange={handleChange} isEditing={true} isPrintReadOnly={isReadOnly} fallback={""} /> // Editing as text, saving will depend on parsing
                ) : (
                  <DataItem label="Garansi" value={serviceData.garansi ? "Masih Garansi" : "Habis / Tidak Ada"} isEditing={false} fallback={"Habis / Tidak Ada"} />
                )}
        
                {/* Biaya Perbaikan Total - Display only, not editable here */}
                <p className="flex justify-between items-center text-sm pt-2 border-t border-gray-700/30">
                    <span className="text-gray-400 font-medium">Biaya Perbaikan Total:</span>
                    <span className="text-emerald-400 font-bold">Rp {Number(serviceData.total_biaya || 0).toLocaleString("id-ID")}</span>
                </p>
      </div>

    </section>
  );
}
"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { Edit, Save, X } from "lucide-react";
import TeknisiUdate from "./TeknisiUpdate";

type Props = {
  serviceData: any;
  formatDateTime: (ts: any) => string;
  docId: string;
  onUpdate: (data: any) => void;
  setErrorMsg: (m: string | null) => void;
  setSuccessMsg: (m: string | null) => void;
};

// Helper component for input fields
const EditInput = ({ label, name, value, onChange }: any) => (
  <p className="data-grid-item items-center">
    <span className="data-label">{label}:</span>
    <input
      type="text"
      name={name}
      value={value || ""}
      onChange={onChange}
      className="data-value bg-blue-900/50 p-1 rounded-md w-full"
    />
  </p>
);

export default function CustomerDeviceInfo({
  serviceData,
  formatDateTime,
  docId,
  onUpdate,
  setErrorMsg,
  setSuccessMsg,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState({
    ...serviceData,
    teknisi_bertugas: serviceData.teknisi_bertugas || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditableData({
      ...serviceData,
      teknisi_bertugas: serviceData.teknisi_bertugas || "",
    });
  }, [serviceData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditableData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleTechnicianSelect = (technicianName: string) => {
    setEditableData((prev: any) => ({ ...prev, teknisi_bertugas: technicianName }));
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const docRef = doc(db, "service_requests", docId);
      await updateDoc(docRef, editableData);
      
      onUpdate(editableData); // Update parent state
      setSuccessMsg("Data berhasil diperbarui!");
      setIsEditing(false);
    } catch (err: any) {
      console.error("Update error:", err);
      setErrorMsg("Gagal memperbarui data. " + err.message);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    setEditableData({
      ...serviceData,
      teknisi_bertugas: serviceData.teknisi_bertugas || "",
    }); // Revert changes
    setIsEditing(false);
  };

  return (
    <section className="grid md:grid-cols-2 gap-6 relative">
      
      {/* EDIT BUTTON */}
      {!isEditing && (
        <button 
          onClick={() => setIsEditing(true)}
          className="absolute top-0 right-0 mt-4 mr-4 flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-lg shadow-md transition-colors"
        >
          <Edit size={14} />
          Ubah Data
        </button>
      )}

      {/* ============================
          DATA CUSTOMER
      ============================= */}
      <div className="bg-[#0f1c33] p-6 rounded-xl space-y-3 shadow-lg border border-blue-900/30">
        <h3 className="text-xl font-bold text-yellow-400 border-b border-blue-900/50 pb-2">
          Data Customer
        </h3>

        {isEditing ? (
          <>
            <EditInput label="Nama" name="nama" value={editableData.nama} onChange={handleChange} />
            <EditInput label="No HP" name="no_hp" value={editableData.no_hp} onChange={handleChange} />
            <EditInput label="Email" name="email" value={editableData.email} onChange={handleChange} />
            <EditInput label="Alamat" name="alamat" value={editableData.alamat} onChange={handleChange} />
          </>
        ) : (
          <>
            <p className="data-grid-item"><span className="data-label">Nama:</span><span className="data-value">{serviceData.nama || "-"}</span></p>
            <p className="data-grid-item"><span className="data-label">No HP:</span><span className="data-value">{serviceData.no_hp || "-"}</span></p>
            <p className="data-grid-item"><span className="data-label">Email:</span><span className="data-value">{serviceData.email || "-"}</span></p>
            <p className="data-grid-item"><span className="data-label">Alamat:</span><span className="data-value">{serviceData.alamat || "-"}</span></p>
          </>
        )}
        
        <p className="data-grid-item"><span className="data-label">Penerima Service:</span><span className="data-value">{serviceData.penerima_service || "-"}</span></p>
        <p className="data-grid-item"><span className="data-label">Tanggal Masuk:</span><span className="data-value">{formatDateTime(serviceData.timestamp)}</span></p>
      </div>

      {/* ============================
          DATA PERANGKAT
      ============================= */}
      <div className="bg-[#0f1c33] p-6 rounded-xl space-y-3 shadow-lg border border-blue-900/30">
        <h3 className="text-xl font-bold text-yellow-400 border-b border-blue-900/50 pb-2">
          Data Perangkat
        </h3>

        {isEditing ? (
            <>
                <EditInput label="Merk" name="merk" value={editableData.merk} onChange={handleChange} />
                <EditInput label="Tipe" name="tipe" value={editableData.tipe} onChange={handleChange} />
                <EditInput label="Serial Number" name="serial_number" value={editableData.serial_number} onChange={handleChange} />
                <p className="data-grid-item items-start">
                    <span className="data-label">Keluhan:</span>
                    <textarea name="keluhan" value={editableData.keluhan} onChange={handleChange} className="data-value bg-blue-900/50 p-1 rounded-md w-full h-20" />
                </p>
            </>
        ) : (
            <>
                <p className="data-grid-item"><span className="data-label">Merk:</span><span className="data-value">{serviceData.merk || "-"}</span></p>
                <p className="data-grid-item"><span className="data-label">Tipe:</span><span className="data-value">{serviceData.tipe || "-"}</span></p>
                <p className="data-grid-item"><span className="data-label">Serial Number:</span><span className="data-value">{serviceData.serial_number || "-"}</span></p>
                <p className="data-grid-item"><span className="data-label">Keluhan:</span><span className="data-value">{serviceData.keluhan || "-"}</span></p>
            </>
        )}

        <p className="data-grid-item"><span className="data-label">Kondisi:</span><span className="data-value">{Array.isArray(serviceData.kondisi) ? serviceData.kondisi.join(", ") : serviceData.kondisi || "-"}</span></p>
        <p className="data-grid-item"><span className="data-label">Spesifikasi Tambahan:</span><span className="data-value">{serviceData.spesifikasi_teknis || "-"}</span></p>
        <p className="data-grid-item"><span className="data-label">Garansi:</span><span className="data-value">{serviceData.garansi ? "Masih Garansi" : "Habis / Tidak Ada"}</span></p>

        {/* Biaya */}
        <p className="data-grid-item"><span className="data-label">Biaya Perbaikan Total:</span><span className="text-emerald-400 font-bold">Rp {Number(serviceData.total_biaya || 0).toLocaleString("id-ID")}</span></p>
        
        {isEditing && (
          <div className="flex justify-end items-center gap-3 pt-4 border-t border-blue-900/50">
              <button onClick={handleCancel} disabled={isSaving} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white font-semibold py-1 px-3 rounded-lg transition-colors">
                  <X size={16} /> Batal
              </button>
              <button onClick={handleUpdate} disabled={isSaving} className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded-lg shadow-md transition-colors disabled:bg-green-800">
                  {isSaving ? <><span className="animate-spin text-lg">⏳</span><span>Menyimpan...</span></> : <><Save size={14} /> Simpan Perubahan</>}
              </button>
          </div>
        )}
      </div>


    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import useAuth from "@/hooks/useAuth";
import NavbarSwitcher from "@/app/components/navbars/NavbarSwitcher";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { ROLES } from "@/lib/roles";
import SignatureCanvas from "react-signature-canvas";

// 🔹 Import components yang tadi kita buat
import CustomerDeviceInfo from "@/app/tns/CustomerDeviceInfo";
import StatusControl from "@/app/tns/StatusControl";
import EstimasiSection from "@/app/tns/EstimasiSection";
import SignatureSection from "@/app/tns/SignatureSection";
import PhotoUploadSection from "@/app/tns/PhotoUploadSection";

type EstimasiItem = {
  id: string;
  item: string;
  harga: number;
  qty: number;
  total: number;
};

type StatusLog = {
  status: string;
  note?: string;
  updatedBy?: string;
  updatedAt?: any;
};

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, role, loading } = useAuth();

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serviceData, setServiceData] = useState<any | null>(null);

  const [status, setStatus] = useState<string>("pending");
  const [statusLog, setStatusLog] = useState<StatusLog[]>([]);
  const [estimasiItems, setEstimasiItems] = useState<EstimasiItem[]>([]);
  const [teknisiNote, setTeknisiNote] = useState("");

  const [handoverPhotoUrl, setHandoverPhotoUrl] = useState<string>("");
  const [pickupPhotoUrl, setPickupPhotoUrl] = useState<string>("");

  const [signatureUrl, setSignatureUrl] = useState<string>("");
  const signatureRef = useRef<SignatureCanvas | null>(null);

  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const docId = params?.id as string;

  // 🔒 Role protection (Customer hanya lihat)
  const isInternal = role !== ROLES.CUSTOMER;

  useEffect(() => {
    if (!loading) {
      if (!user) return router.push("/login");
    }
  }, [loading, user, router]);

  // 🧩 Upload ke Cloudinary
  const uploadToCloudinary = async (fileOrDataUrl: File | string) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    const fd = new FormData();
    fd.append("file", fileOrDataUrl);
    fd.append("upload_preset", preset!);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: fd,
    });

    const data = await res.json();
    return data.secure_url;
  };

  // 🔄 Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const ref = doc(db, "service_requests", docId);
        const snap = await getDoc(ref);

        if (!snap.exists()) return setError("Data tidak ditemukan");

        const data = snap.data();
        setServiceData({ id: snap.id, ...data });

        setStatus(data.status);
        setStatusLog(data.status_log || []);
        setEstimasiItems(data.estimasi_items || []);
        setTeknisiNote(data.teknisi_note || "");

        setHandoverPhotoUrl(data.handover_photo_url || "");
        setPickupPhotoUrl(data.pickup_photo_url || "");
        setSignatureUrl(data.customer_signature_url || "");
      } catch {
        setError("Gagal memuat data");
      } finally {
        setLoadingData(false);
      }
    };

    if (user) fetchData();
  }, [docId, user]);

  // ℹ Format TS Firestore
  const formatDateTime = (ts: any) =>
    ts?.seconds
      ? new Date(ts.seconds * 1000).toLocaleString("id-ID", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "-";

  // 💾 Update status
  const handleUpdateStatus = async () => {
    if (!isInternal) return;
    try {
      setSaving(true);
      const newLog: StatusLog = {
        status,
        updatedBy: user?.email || "system",
        updatedAt: new Date(),
      };

      const updated = [...statusLog, newLog];
      setStatusLog(updated);

      await updateDoc(doc(db, "service_requests", docId), {
        status,
        status_log: updated,
      });

      setSuccess("Status diperbarui");
    } catch {
      setError("Gagal update status");
    } finally {
      setSaving(false);
    }
  };

  // 💾 Simpan Estimasi
  const handleSaveEstimasi = async () => {
    if (!isInternal) return;
    try {
      setSaving(true);
      await updateDoc(doc(db, "service_requests", docId), {
        estimasi_items: estimasiItems,
        teknisi_note: teknisiNote,
      });
      setSuccess("Estimasi tersimpan");
    } catch {
      setError("Gagal simpan estimasi");
    } finally {
      setSaving(false);
    }
  };

  // 📸 Upload foto
  const handleUploadPhoto = async (e: any, type: "handover" | "pickup") => {
    if (!isInternal) return;
    const file = e.target.files[0];
    if (!file) return;

    try {
      setSaving(true);
      const url = await uploadToCloudinary(file);
      if (type === "handover") setHandoverPhotoUrl(url);
      else setPickupPhotoUrl(url);

      await updateDoc(doc(db, "service_requests", docId), {
        [`${type}_photo_url`]: url,
      });
    } finally {
      setSaving(false);
    }
  };

  // ✔ Signature
  const saveSignature = async () => {
    if (!isInternal || !signatureRef.current) return;
    try {
      setSaving(true);

      const dataUrl = signatureRef.current.getTrimmedCanvas().toDataURL();
      const url = await uploadToCloudinary(dataUrl);
      setSignatureUrl(url);

      await updateDoc(doc(db, "service_requests", docId), {
        customer_signature_url: url,
      });

      setSuccess("Tanda tangan tersimpan");
    } finally {
      setSaving(false);
    }
  };

  const addRow = () =>
    setEstimasiItems((prev) => [
      ...prev,
      { id: String(prev.length + 1), item: "", harga: 0, qty: 1, total: 0 },
    ]);

  const removeRow = (id: string) =>
    setEstimasiItems((prev) => prev.filter((r) => r.id !== id));

  const totalEstimasi = estimasiItems.reduce((a, b) => a + (b.total || 0), 0);

  const handleChange = (id: string, field: any, value: string) =>
    setEstimasiItems((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, [field]: Number(value), total: r.qty * r.harga }
          : r
      )
    );

  if (loading || loadingData) return <div className="text-gray-200 p-10">Loading…</div>;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0d1117] text-white">
        <NavbarSwitcher />

        <div className="pt-24 max-w-6xl mx-auto p-6 space-y-6">
          {error && <p className="bg-red-700 p-2 rounded">{error}</p>}
          {success && <p className="bg-green-700 p-2 rounded">{success}</p>}

          {/* ➤ Info Customer + Perangkat */}
          <CustomerDeviceInfo serviceData={serviceData} formatDateTime={formatDateTime} />

          {/* ➤ Status */}
          <StatusControl
            status={status}
            setStatus={setStatus}
            statusLog={statusLog}
            isSaving={saving}
            handleUpdateStatus={handleUpdateStatus}
            formatDateTime={formatDateTime}
          />

          {/* ➤ Estimasi Harga */}
          <EstimasiSection
            estimasiItems={estimasiItems}
            totalEstimasi={totalEstimasi}
            teknisiNote={teknisiNote}
            setTeknisiNote={setTeknisiNote}
            handleSave={handleSaveEstimasi}
            addRow={addRow}
            removeRow={removeRow}
            handleChange={handleChange}
            isSaving={saving}
          />

          {/* ➤ Foto */}
          <div className="grid md:grid-cols-2 gap-4">
            <PhotoUploadSection
              type="handover"
              title="Foto Serah Terima"
              handleUpload={handleUploadPhoto}
              imageUrl={handoverPhotoUrl}
              saving={saving}
            />
            <PhotoUploadSection
              type="pickup"
              title="Foto Pengambilan"
              handleUpload={handleUploadPhoto}
              imageUrl={pickupPhotoUrl}
              saving={saving}
            />
          </div>

          {/* ➤ Signature */}
          <SignatureSection
            signatureUrl={signatureUrl}
            saving={saving}
            signatureRef={signatureRef}
            handleClear={() => signatureRef.current?.clear()}
            handleSave={saveSignature}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}

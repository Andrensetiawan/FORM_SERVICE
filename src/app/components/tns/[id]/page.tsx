"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import toast, { Toaster } from 'react-hot-toast';

import useAuth from "@/hooks/useAuth";
import NavbarSwitcher from "@/app/components/navbars/NavbarSwitcher";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { ROLES } from "@/lib/roles";

import CustomerDeviceInfo from "@/app/components/tns/CustomerDeviceInfo";
import StatusControl from "@/app/components/tns/StatusControl";
import EstimasiSection from "@/app/components/tns/EstimasiSection";
import MediaUploadSection from "@/app/components/tns/PhotoUploadSection";
import SignatureSection from "@/app/components/tns/SignatureSection";
import TeknisiUdate from "@/app/components/tns/TeknisiUpdate";

type EstimasiItem = {
  id: string;
  item: string;
  harga: number;
  qty: number;
  total: number;
};

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, role, loading } = useAuth();

  const [serviceData, setServiceData] = useState<any>(null);
  const [status, setStatus] = useState("pending");
  const [statusLog, setStatusLog] = useState<any[]>([]);

  const [estimasiItems, setEstimasiItems] = useState<EstimasiItem[]>([]);
  
  const [handoverPhotoUrl, setHandoverPhotoUrl] = useState<string[]>([]);
  const [pickupPhotoUrl, setPickupPhotoUrl] = useState<string[]>([]);
  const [buktiTransferPhotoUrl, setBuktiTransferPhotoUrl] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [selectedTechnicianName, setSelectedTechnicianName] = useState("");

  const docId = (params as any)?.id as string;
  const isInternal = role !== ROLES.CUSTOMER;
  const isAdmin = role === ROLES.ADMIN || role === ROLES.MANAGER || role === ROLES.OWNER;

  const setSuccessMsg = (msg: string | null) => {
    if (msg) toast.success(msg);
  };
  const setErrorMsg = (msg: string | null) => {
    if (msg) toast.error(msg);
  };

  const handleSelectTechnician = (technicianName: string) => {
    setSelectedTechnicianName(technicianName);
  };

  /* Protect page */
  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  /* Load data */
  useEffect(() => {
    const loadData = async () => {
      try {
        const ref = doc(db, "service_requests", docId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setErrorMsg("Data tidak ditemukan");
          notFound(); // Call notFound() if document doesn't exist
        }

        const data = snap.data();
        setServiceData({ id: snap.id, ...data });

        setStatus(data.status || "pending");
        setStatusLog(data.status_log || []);
        setSelectedTechnicianName(data.assignedTechnician || "");

        const est: EstimasiItem[] = (data.estimasi_items || []).map((e: any) => ({
          id: String(e.id),
          item: e.item || "",
          harga: Number(e.harga) || 0,
          qty: Number(e.qty) || 0,
          total: Number(e.total) || 0,
        }));
        setEstimasiItems(est);

        // Ensure photo URLs are always arrays
        setHandoverPhotoUrl(Array.isArray(data.handover_photo_url) ? data.handover_photo_url : (data.handover_photo_url ? [data.handover_photo_url] : []));
        setPickupPhotoUrl(Array.isArray(data.pickup_photo_url) ? data.pickup_photo_url : (data.pickup_photo_url ? [data.pickup_photo_url] : []));
        setBuktiTransferPhotoUrl(Array.isArray(data.transfer_proof_url) ? data.transfer_proof_url : (data.transfer_proof_url ? [data.transfer_proof_url] : []));
      } catch (err) {
        console.error("loadData error:", err);
        setErrorMsg("Gagal memuat data");
      } finally {
        setLoadingData(false);
      }
    };

    if (user) loadData();
  }, [user, docId]);

  const formatDateTime = (ts: any) => {
    if (typeof ts === "number") {
      return new Date(ts).toLocaleString("id-ID", {
        dateStyle: "short",
        timeStyle: "short",
      });
    }
    if (ts?.seconds) {
      return new Date(ts.seconds * 1000).toLocaleString("id-ID", {
        dateStyle: "short",
        timeStyle: "short",
      });
    }
    return "-";
  };

  /* Update Status */
  const handleUpdateStatus = async () => {
    if (!isInternal) return;

    try {
      setSaving(true);

      const ref = doc(db, "service_requests", docId);
      const snap = await getDoc(ref);
      const data = snap.data();

      const safeLog = Array.isArray(data?.status_log) ? data.status_log : [];

      const entry = {
        status,
        updatedBy: user?.email || "system",
        updatedAt: Date.now(),
      };

      await updateDoc(ref, {
        status,
        updatedAt: serverTimestamp(),
        status_log: [...safeLog, entry],
      });

      setStatusLog((prev) => [...prev, entry]);
      setSuccessMsg("Status berhasil diperbarui!");
    } catch (err) {
      console.error("handleUpdateStatus", err);
      setErrorMsg("Gagal update status");
    } finally {
      setSaving(false);
    }
  };

  /* Estimasi */
  const addRow = () =>
    setEstimasiItems((prev) => [
      ...prev,
      { id: String(prev.length + 1), item: "", harga: 0, qty: 1, total: 0 },
    ]);

  const removeRow = (id: string) =>
    setEstimasiItems((prev) => prev.filter((x) => x.id !== id));

  const handleChange = (
    id: string,
    field: "item" | "harga" | "qty",
    value: string | number
  ) => {
    setEstimasiItems((prev) =>
      prev.map((x) => {
        if (x.id !== id) return x;
        const upd = { ...x };
        if (field === "item") upd.item = String(value);
        if (field === "harga") upd.harga = Number(value) || 0;
        if (field === "qty") upd.qty = Number(value) || 0;
        upd.total = upd.harga * upd.qty;
        return upd;
      })
    );
  };

  const totalEstimasi = estimasiItems.reduce(
    (sum, x) => sum + (x.total || 0),
    0
  );

  useEffect(() => {
    if (serviceData) {
      const dp = serviceData.dp || 0;
      const newTotalBiaya = totalEstimasi - dp;
      setServiceData((prev: any) => ({
        ...prev,
        total_biaya: newTotalBiaya,
      }));
    }
  }, [totalEstimasi, serviceData?.dp]);

  const handleDpChange = (value: number) => {
    setServiceData((prev: any) => ({
      ...prev,
      dp: value,
    }));
  };

  const handleSaveEstimasi = async () => {
    if (!isInternal) return;

    try {
      setSaving(true);

      const dp = serviceData.dp || 0;
      const newTotalBiaya = totalEstimasi - dp;

      await updateDoc(doc(db, "service_requests", docId), {
        estimasi_items: estimasiItems,
        total_biaya: newTotalBiaya,
        dp: dp,
        updatedAt: serverTimestamp(),
      });

      setSuccessMsg("Estimasi berhasil disimpan!");
    } catch (err) {
      console.error("handleSaveEstimasi", err);
      setErrorMsg("Gagal menyimpan estimasi");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpdate = (field: string, urls: string[]) => {
    if (field === "handover_photo_url") {
      setHandoverPhotoUrl(urls);
    } else if (field === "pickup_photo_url") {
      setPickupPhotoUrl(urls);
    } else if (field === "transfer_proof_url") {
      setBuktiTransferPhotoUrl(urls);
    }
  };

  const handleInfoUpdate = (updatedData: any) => {
    setServiceData((prev: any) => ({ ...prev, ...updatedData }));
  };

  if (loading || loadingData)
    return <div className="p-10 text-white">Memuat data…</div>;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0d1117] text-white">
        <Toaster
          position="top-center"
          reverseOrder={false}
        />
        <NavbarSwitcher />

        <div className="pt-24 max-w-6xl mx-auto p-6 space-y-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-4">
            Service Detail <span className="text-blue-400">TNS: {serviceData?.track_number}</span>
          </h1>

          <CustomerDeviceInfo
            docId={docId}
            serviceData={serviceData}
            formatDateTime={formatDateTime}
            onUpdate={handleInfoUpdate}
            setErrorMsg={setErrorMsg}
            setSuccessMsg={setSuccessMsg}
          />

          <StatusControl
            status={status}
            setStatus={setStatus}
            statusLog={statusLog}
            isSaving={saving}
            handleUpdateStatus={handleUpdateStatus}
            formatDateTime={formatDateTime}
          />

          <EstimasiSection
            estimasiItems={estimasiItems}
            totalEstimasi={totalEstimasi}
            dp={serviceData?.dp || 0}
            onDpChange={handleDpChange}
            handleSave={handleSaveEstimasi}
            addRow={addRow}
            removeRow={removeRow}
            handleChange={handleChange}
            isSaving={saving}
          />

          <div className="grid md:grid-cols-3 gap-4">
            <MediaUploadSection
              docId={docId}
              field="transfer_proof_url"
              title="Foto Bukti Transfer"
              existingUrl={buktiTransferPhotoUrl}
              setErrorMsg={setErrorMsg}
              setSuccessMsg={setSuccessMsg}
              onUpdate={(urls) => handlePhotoUpdate("transfer_proof_url", urls)}
              showCamera={true}
            />
            <MediaUploadSection
              docId={docId}
              field="handover_photo_url"
              title="Foto Serah Terima"
              existingUrl={handoverPhotoUrl}
              setErrorMsg={setErrorMsg}
              setSuccessMsg={setSuccessMsg}
              onUpdate={(urls) => handlePhotoUpdate("handover_photo_url", urls)}
              showCamera={true}
            />

            <MediaUploadSection
              docId={docId}
              field="pickup_photo_url"
              title="Foto Pengambilan"
              existingUrl={pickupPhotoUrl}
              setErrorMsg={setErrorMsg}
              setSuccessMsg={setSuccessMsg}
              onUpdate={(urls) => handlePhotoUpdate("pickup_photo_url", urls)}
              showCamera={true}
            />
          </div>

          <SignatureSection
            docId={docId}
            existingSignature={serviceData?.customer_signature_url}
            existingSignaturePublicId={serviceData?.customer_signature_public_id}
            user={user}
            setErrorMsg={setErrorMsg}
            setSuccessMsg={setSuccessMsg}
          />
        </div>
        <div className="mt-8 p-6 bg-[#0d1117] border border-gray-700 shadow rounded-2xl">
            <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2 mb-4">
              Penugasan Teknisi (TNS: {serviceData?.track_number})
            </h3>
            <TeknisiUdate
              docId={docId}
              currentTechnician={selectedTechnicianName}
              onTechnicianSelect={handleSelectTechnician}
              isEditing={isAdmin} // Only admin can edit technician assignment
              setErrorMsg={setErrorMsg}
              setSuccessMsg={setSuccessMsg}
            />
          </div>
      </div>
    </ProtectedRoute>
  );
}
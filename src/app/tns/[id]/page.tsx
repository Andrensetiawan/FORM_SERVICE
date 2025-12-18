"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "@/lib/firebaseConfig";
import toast, { Toaster } from 'react-hot-toast';
import { Printer } from "lucide-react"; // Import Printer icon

import useAuth from "@/hooks/useAuth";
import NavbarSwitcher from "@/components/navbars/NavbarSwitcher";
import { ROLES, UserRole } from "@/lib/roles";
import { createLog } from "@/lib/log";

import CustomerDeviceInfo from "@/components/tns/CustomerDeviceInfo";
import StatusControl from "@/components/tns/StatusControl";
import CustomerLog from "@/components/tns/CustomerLog";
import EstimasiSection from "@/components/tns/EstimasiSection";
import MediaUploadSection from "@/components/tns/PhotoUploadSection";
import SignatureSection from "@/components/tns/SignatureSection";
import TeknisiUpdate from "@/components/tns/TeknisiUpdate";

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
  const auth = getAuth();

  const [serviceData, setServiceData] = useState<any>(null);
  const [status, setStatus] = useState("pending");
  const [statusLog, setStatusLog] = useState<any[]>([]);

  const [estimasiItems, setEstimasiItems] = useState<EstimasiItem[]>([]);
  
  const [handoverPhotoUrl, setHandoverPhotoUrl] = useState<string[]>([]);
  const [pickupPhotoUrl, setPickupPhotoUrl] = useState<string[]>([]);
  const [buktiTransferPhotoUrl, setBuktiTransferPhotoUrl] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);

  const docId = (params as any)?.id as string;
  
  // Define roles based on logged-in user, default to false if no user
  const isInternal = user && role !== ROLES.CUSTOMER;
  const isAdminOrManagerOrOwner = !!(user && (role === ROLES.ADMIN || role === ROLES.MANAGER || role === ROLES.OWNER));
  const canAssignTechnician = isAdminOrManagerOrOwner;
  const canEditUnitLogSection = !!(user && (role === ROLES.ADMIN || role === ROLES.MANAGER || role === ROLES.OWNER || role === ROLES.STAFF));
  const isPublic = !user;


  const setSuccessMsg = (msg: string | null) => {
    if (msg) toast.success(msg);
  };
  const setErrorMsg = (msg: string | null) => {
    if (msg) toast.error(msg);
  };

  const handleSelectTechnician = (technicians: string[]) => {
    setSelectedTechnicians(technicians);
  };

  /* Load data - now runs for everyone */
  useEffect(() => {
    if (!docId) return;

    const loadData = async () => {
      try {
        const ref = doc(db, "service_requests", docId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setErrorMsg("Data tidak ditemukan");
          return notFound();
        }

        const data = snap.data();
        setServiceData({ id: snap.id, ...data });

        setStatus(data.status || "pending");
        setStatusLog(data.status_log || []);
        
        // Only set technicians if they exist
        if(data.assignedTechnicians) {
            setSelectedTechnicians(Array.isArray(data.assignedTechnicians) ? data.assignedTechnicians : [data.assignedTechnicians]);
        }

        const est: EstimasiItem[] = (data.estimasi_items || []).map((e: any) => ({
          id: String(e.id),
          item: e.item || "",
          harga: Number(e.harga) || 0,
          qty: Number(e.qty) || 0,
          total: Number(e.total) || 0,
        }));
        setEstimasiItems(est);

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

    loadData();
  }, [docId]);

  const formatDateTime = (ts: any) => {
    if (!ts) return "-"; // Handle null/undefined timestamp

    let dateValue: number;

    if (typeof ts === "object" && (ts._seconds || ts.seconds)) {
      // Firebase Timestamp object (either {seconds, nanoseconds} or {_seconds, _nanoseconds})
      dateValue = (ts._seconds ?? ts.seconds) * 1000; // Convert to milliseconds
    } else if (typeof ts === "number") {
      // Raw number timestamp (assume seconds if not specified)
      dateValue = ts * 1000; // Convert to milliseconds
    } else {
      return "-"; // Unrecognized timestamp format
    }

    // Check if the dateValue is valid before creating a Date object
    if (isNaN(dateValue) || dateValue === 0) {
      return "-";
    }

    try {
      return new Date(dateValue).toLocaleString("id-ID", {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "-";
    }
  };

  /* Update Status */
  const handleUpdateStatus = async () => {
    if (!isInternal || !user) return;

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

      await createLog({
        uid: user.uid,
        role: role as UserRole,
        action: "update_service_status",
        target: docId,
        detail: { newStatus: status },
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
  const addRow = () => setEstimasiItems((prev) => [...prev, { id: String(Date.now()), item: "", harga: 0, qty: 1, total: 0 }]);
  const removeRow = (id: string) => setEstimasiItems((prev) => prev.filter((x) => x.id !== id));
  const handleChange = (id: string, field: "item" | "harga" | "qty", value: string | number) => {
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

  const totalEstimasi = estimasiItems.reduce((sum, x) => sum + (x.total || 0), 0);

  useEffect(() => {
    if (serviceData) {
      const dp = serviceData.dp || 0;
      const newTotalBiaya = totalEstimasi - dp;
      setServiceData((prev: any) => ({ ...prev, total_biaya: newTotalBiaya }));
    }
  }, [totalEstimasi, serviceData?.dp]);

  const handleDpChange = (value: number) => {
    setServiceData((prev: any) => ({ ...prev, dp: value, }));
  };

  const handleSaveEstimasi = async () => {
    if (!isInternal || !user) return;
    try {
      setSaving(true);
      const dp = serviceData.dp || 0;
      const newTotalBiaya = totalEstimasi - dp;
      const payload = {
        estimasi_items: estimasiItems,
        total_biaya: newTotalBiaya,
        dp: dp,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(doc(db, "service_requests", docId), payload);

      await createLog({
        uid: user.uid,
        role: role as UserRole,
        action: "update_service_estimation",
        target: docId,
        detail: payload,
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
    if (field === "handover_photo_url") setHandoverPhotoUrl(urls);
    else if (field === "pickup_photo_url") setPickupPhotoUrl(urls);
    else if (field === "transfer_proof_url") setBuktiTransferPhotoUrl(urls);
  };

  const handleInfoUpdate = (updatedData: any) => {
    setServiceData((prev: any) => ({ ...prev, ...updatedData }));
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || loadingData) return <div className="h-screen w-full flex items-center justify-center bg-[#0d1117] text-white"><h1>Memuat data service...</h1></div>;
  if (!serviceData) return <div className="h-screen w-full flex items-center justify-center bg-[#0d1117] text-white"><h1>Data service tidak ditemukan.</h1></div>;


  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
        <Toaster position="top-center" reverseOrder={false} />
        <NavbarSwitcher className="print:hidden" />

        <div className="pt-24 max-w-6xl mx-auto p-6 space-y-8">
            {/* The main interactive content */}
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold text-gray-100">
                    Service Detail <span className="text-blue-400">: {serviceData?.track_number}</span>
                </h1>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 text-sm bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors print:hidden"
                >
                  <Printer size={16} />
                  Cetak/Unduh
                </button>
              </div>

              <CustomerDeviceInfo
                  docId={docId}
                  serviceData={serviceData}
                  formatDateTime={formatDateTime}
                  onUpdate={handleInfoUpdate}
                  setErrorMsg={setErrorMsg}
                  setSuccessMsg={setSuccessMsg}
                  isReadOnly={isPublic} // Pass read-only state
              />
            <StatusControl
                status={status}
                setStatus={setStatus}
                isSaving={saving}
                handleUpdateStatus={handleUpdateStatus}
                formatDateTime={formatDateTime}
                statusLog={statusLog}
                isReadOnly={!isInternal} // Disable for non-internal users
                className="print:hidden my-8"
            />              
              {isInternal && (
                <>
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
                                    className="my-8"
                                  />
                  <div className="grid md:grid-cols-3 gap-4 print:hidden my-9">
                    <MediaUploadSection
                      docId={docId}
                      field="transfer_proof_url"
                      title="Foto Bukti Transfer"
                      existingUrl={buktiTransferPhotoUrl}
                      setErrorMsg={setErrorMsg}
                      setSuccessMsg={setSuccessMsg}
                      onUpdate={(urls: string[]) => handlePhotoUpdate("transfer_proof_url", urls)}
                      showCamera={true}
                    />
                    <MediaUploadSection
                      docId={docId}
                      field="handover_photo_url"
                      title="Foto Serah Terima"
                      existingUrl={handoverPhotoUrl}
                      setErrorMsg={setErrorMsg}
                      setSuccessMsg={setSuccessMsg}
                      onUpdate={(urls: string[]) => handlePhotoUpdate("handover_photo_url", urls)}
                      showCamera={true}
                    />
                    <MediaUploadSection
                      docId={docId}
                      field="pickup_photo_url"
                      title="Foto Pengambilan"
                      existingUrl={pickupPhotoUrl}
                      setErrorMsg={setErrorMsg}
                      setSuccessMsg={setSuccessMsg}
                      onUpdate={(urls: string[]) => handlePhotoUpdate("pickup_photo_url", urls)}
                      showCamera={true}
                    />
                  </div>
                                  <SignatureSection
                                    docId={docId}
                                    existingSignature={serviceData?.customer_signature_url}
                                    existingSignaturePublicId={serviceData?.customer_signature_public_id}
                                    setErrorMsg={setErrorMsg}
                                    setSuccessMsg={setSuccessMsg}
                                    user={auth.currentUser}
                                    className="print:hidden my-8"
                                  />                  <div className="mt-8 p-6 bg-[#0d1117] border border-gray-700 shadow rounded-2xl print:hidden">
                      <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2 mb-4">
                      Penugasan Teknisi (TNS: {serviceData?.track_number})
                      </h3>
                      <TeknisiUpdate
                        docId={docId}
                        currentTechnicians={selectedTechnicians}
                        onTechnicianSelect={handleSelectTechnician}
                        isEditing={canAssignTechnician}
                        canEditUnitLog={canEditUnitLogSection}
                        setErrorMsg={setErrorMsg}
                        setSuccessMsg={setSuccessMsg}
                      />
                  </div>
                </>
              )}
              <CustomerLog
                  docId={docId}
                  setErrorMsg={setErrorMsg}
                  setSuccessMsg={setSuccessMsg}
                  className="print:hidden my-8"
              />            </div> {/* End of div hiding interactive content */}

    </div>
  );
}

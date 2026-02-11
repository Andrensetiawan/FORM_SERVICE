"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import toast, { Toaster } from "react-hot-toast";

import NavbarSwitcher from "@/components/navbars/NavbarSwitcher";
import CustomerDeviceInfo from "@/components/tns/CustomerDeviceInfo";
import StatusControl from "@/components/tns/StatusControl";
import EstimasiSection from "@/components/tns/EstimasiSection";
import PaymentSection from "@/components/tns/PaymentSection";
import DPPayment from "@/components/tns/DPPayment";
import CustomerLog from "@/components/tns/CustomerLog";

type EstimasiItem = {
  id: string;
  item: string;
  harga: number;
  qty: number;
  total: number;
};

export default function PublicViewPage() {
  const params = useParams();
  const token = (params as any)?.token as string;

  const [docId, setDocId] = useState<string | null>(null);
  const [serviceData, setServiceData] = useState<any>(null);
  const [status, setStatus] = useState("pending");
  const [statusLog, setStatusLog] = useState<any[]>([]);
  const [estimasiItems, setEstimasiItems] = useState<EstimasiItem[]>([]);
  const [buktiTransferPhotoUrl, setBuktiTransferPhotoUrl] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const setErrorMsg = (msg: string | null) => { if (msg) toast.error(msg); };
  const setSuccessMsg = (msg: string | null) => { if (msg) toast.success(msg); };

  const formatDateTime = (ts: any) => {
    if (!ts) return "-";
    try {
      if (typeof ts === "object" && (ts._seconds || ts.seconds)) {
        const secs = Number(ts._seconds ?? ts.seconds);
        if (!isNaN(secs) && secs > 0) {
          return new Date(secs * 1000).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
        }
      }
      if (ts instanceof Date) return ts.toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
      if (typeof ts === "number") {
        const value = ts > 1e11 ? ts : ts * 1000;
        return new Date(value).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
      }
      if (typeof ts === "object" && ts?.toMillis) {
        return new Date(ts.toMillis()).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
      }
      return "-";
    } catch {
      return "-";
    }
  };

  useEffect(() => {
    if (!token) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const publicRef = doc(db, "public_views", token);
        const publicSnap = await getDoc(publicRef);
        if (!publicSnap.exists()) {
          setErrorMsg("Tautan publik tidak ditemukan atau sudah kedaluwarsa.");
          return notFound();
        }
        const publicData = publicSnap.data();
        const targetDocId = publicData.docId;
        setDocId(targetDocId);

        const serviceRef = doc(db, "service_requests", targetDocId);
        const serviceSnap = await getDoc(serviceRef);
        if (!serviceSnap.exists()) {
          setErrorMsg("Data service tidak ditemukan.");
          return notFound();
        }

        const data = serviceSnap.data();
        setServiceData({ id: serviceSnap.id, ...data });
        const statusLogData = data.status_log || [];
        setStatusLog(statusLogData);
        if (statusLogData.length > 0) {
          setStatus(statusLogData[statusLogData.length - 1].status);
        } else {
          setStatus(data.status || "diterima");
        }
        const est: EstimasiItem[] = (data.estimasi_items || []).map((e: any) => ({
          id: String(e.id ?? Date.now()),
          item: e.item || "",
          harga: Number(e.harga) || 0,
          qty: Number(e.qty) || 0,
          total: Number(e.total) || (Number(e.harga) || 0) * (Number(e.qty) || 0),
        }));
        setEstimasiItems(est);
        setBuktiTransferPhotoUrl(Array.isArray(data.transfer_proof_url) ? data.transfer_proof_url : (data.transfer_proof_url ? [data.transfer_proof_url] : []));
      } catch (err) {
        console.error("load public data error", err);
        setErrorMsg("Gagal memuat data publik.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [token]);

  const totalEstimasi = useMemo(() => {
    return estimasiItems.reduce((sum, x) => sum + (x.total || 0), 0);
  }, [estimasiItems]);

  const handleDpChange = (value: number) => {
    setServiceData((prev: any) => ({ ...prev, dp: value }));
  };

  const handlePhotoUpdate = (_field: string, urls: string[]) => {
    setBuktiTransferPhotoUrl(urls);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Memuat tampilan publik...</div>;
  }
  if (!serviceData || !docId) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Data tidak tersedia.</div>;
  }

  return (
    <>
      <style jsx global>{`
        body {
          background-color: #f8f9fa;
          color: #212529;
        }
        .card {
          background-color: #ffffff;
          border: 1px solid #dee2e6;
          border-radius: 0.75rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .card .bg-\[\#0f1c33\] {
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .card .text-yellow-400 { color: #007bff !important; }
        .card .text-gray-400 { color: #6c757d !important; }
        .card .text-white, .card .text-gray-100 { color: #212529 !important; }
        .card button.text-white { color: #ffffff !important; }
        .card label.text-white { color: #ffffff !important; }
        .card span.text-white { color: #ffffff !important; }
        .card .border-blue-900\/50, .card .border-gray-600, .card .border-gray-700 { border-color: #dee2e6 !important; }
        .card .bg-blue-900\/50 { background-color: rgba(0, 123, 255, 0.05) !important; }
        .card .text-emerald-400 { color: #28a745 !important; }
        .card .bg-\[\#0d1117\] { background-color: transparent !important; }
      `}</style>
      <Toaster position="top-center" />
      <NavbarSwitcher className="print:hidden" />
      <div className="h-16 print:hidden" />
      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Service Detail: <span className="text-blue-600">{serviceData.track_number}</span>
          </h1>
          <p className="text-sm text-gray-500">Tautan publik — hanya baca</p>
        </div>

        <div className="card">
          <CustomerDeviceInfo
            docId={docId}
            serviceData={serviceData}
            formatDateTime={formatDateTime}
            onUpdate={() => {}}
            setErrorMsg={setErrorMsg}
            setSuccessMsg={setSuccessMsg}
            isReadOnly
          />
        </div>

        <div className="card">
          <StatusControl
            status={status}
            setStatus={setStatus}
            isSaving={false}
            handleUpdateStatus={async () => {}}
            formatDateTime={formatDateTime}
            statusLog={statusLog}
            isReadOnly
          />
        </div>

        <div className="card">
          <EstimasiSection
            estimasiItems={estimasiItems}
            totalEstimasi={totalEstimasi}
            dp={serviceData?.dp || 0}
            isSaving={false}
            isReadOnly
          />
        </div>

        <div className="card">
          <PaymentSection serviceData={serviceData} isReadOnly />
        </div>

        {totalEstimasi > 0 && (
          <DPPayment
            docId={docId}
            totalEstimasi={totalEstimasi}
            currentDp={serviceData?.dp || 0}
            buktiTransferPhotoUrl={buktiTransferPhotoUrl}
            onUpdate={handlePhotoUpdate}
            setErrorMsg={setErrorMsg}
            setSuccessMsg={setSuccessMsg}
            onDpUpdate={handleDpChange}
          />
        )}

        <div className="card">
          <CustomerLog
            docId={docId}
            setErrorMsg={setErrorMsg}
            setSuccessMsg={setSuccessMsg}
          />
        </div>
      </main>
    </>
  );
}

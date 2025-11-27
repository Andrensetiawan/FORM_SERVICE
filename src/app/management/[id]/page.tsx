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
  updatedAt?: any; // Firestore Timestamp
};

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, role, loading } = useAuth();

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serviceData, setServiceData] = useState<any | null>(null);

  const [status, setStatus] = useState<string>("");
  const [statusLog, setStatusLog] = useState<StatusLog[]>([]);
  const [estimasiItems, setEstimasiItems] = useState<EstimasiItem[]>([]);
  const [teknisiNote, setTeknisiNote] = useState("");
  const [customerNote, setCustomerNote] = useState("");

  const [handoverPhotoUrl, setHandoverPhotoUrl] = useState<string>("");
  const [pickupPhotoUrl, setPickupPhotoUrl] = useState<string>("");

  const [signatureUrl, setSignatureUrl] = useState<string>("");
  const signatureRef = useRef<SignatureCanvas | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const docId = params?.id as string;

  // 🔒 Proteksi role
  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (![ROLES.MANAGER, ROLES.OWNER, ROLES.ADMIN].includes(role as any)) {
        router.push("/unauthorized");
      }
    }
  }, [user, role, loading, router]);

  // ⭐ Helper upload ke Cloudinary
  const uploadImageToCloudinary = async (fileOrDataUrl: File | string) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary env (cloud name / upload preset) belum diset.");
    }

    const formData = new FormData();

    if (fileOrDataUrl instanceof File) {
      formData.append("file", fileOrDataUrl);
    } else {
      // dataURL (signature)
      formData.append("file", fileOrDataUrl);
    }

    formData.append("upload_preset", uploadPreset);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      throw new Error("Gagal upload ke Cloudinary");
    }

    const data = await res.json();
    return data.secure_url as string;
  };

  // 🔄 Ambil data service
  useEffect(() => {
    const fetchData = async () => {
      if (!docId) return;
      try {
        const ref = doc(collection(db, "service_requests"), docId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setErrorMsg("Data service tidak ditemukan.");
          setLoadingData(false);
          return;
        }

        const data = snap.data();
        setServiceData({ id: snap.id, ...data });

        setStatus(data.status || "pending");
        setStatusLog((data.status_log as StatusLog[]) || []);

        setEstimasiItems(
          (data.estimasi_items as EstimasiItem[]) || [
            { id: "1", item: "", harga: 0, qty: 1, total: 0 },
          ]
        );

        setTeknisiNote(data.teknisi_note || "");
        setCustomerNote(data.customer_note || "");

        setHandoverPhotoUrl(data.handover_photo_url || "");
        setPickupPhotoUrl(data.pickup_photo_url || "");
        setSignatureUrl(data.customer_signature_url || "");
      } catch (err: any) {
        console.error(err);
        setErrorMsg("Gagal memuat data service.");
      } finally {
        setLoadingData(false);
      }
    };

    if (!loading && user && role) {
      fetchData();
    }
  }, [docId, loading, user, role]);

  // 📌 Estimasi handler
  const handleEstimasiChange = (
    id: string,
    field: keyof Omit<EstimasiItem, "id" | "total">,
    value: string
  ) => {
    setEstimasiItems((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;

        const newRow = { ...row } as EstimasiItem;

        if (field === "item") {
          newRow.item = value;
        } else if (field === "harga") {
          const num = Number(value) || 0;
          newRow.harga = num;
        } else if (field === "qty") {
          const num = Number(value) || 0;
          newRow.qty = num;
        }

        newRow.total = newRow.harga * newRow.qty;
        return newRow;
      })
    );
  };

  const addEstimasiRow = () => {
    setEstimasiItems((prev) => [
      ...prev,
      {
        id: (prev.length + 1).toString(),
        item: "",
        harga: 0,
        qty: 1,
        total: 0,
      },
    ]);
  };

  const removeEstimasiRow = (id: string) => {
    setEstimasiItems((prev) => prev.filter((row) => row.id !== id));
  };

  const totalEstimasi = estimasiItems.reduce((sum, r) => sum + (r.total || 0), 0);

  // 🖊 Simpan tanda tangan
  const handleSaveSignature = async () => {
    if (!signatureRef.current) return;
    try {
      setSaving(true);
      const dataUrl = signatureRef.current
        .getTrimmedCanvas()
        .toDataURL("image/png");

      const url = await uploadImageToCloudinary(dataUrl);
      setSignatureUrl(url);

      if (serviceData) {
        const ref = doc(db, "service_requests", serviceData.id);
        await updateDoc(ref, {
          customer_signature_url: url,
        });
      }

      setSuccessMsg("Tanda tangan customer berhasil disimpan.");
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal menyimpan tanda tangan.");
    } finally {
      setSaving(false);
    }
  };

  const handleClearSignature = () => {
    signatureRef.current?.clear();
  };

  // 📸 Upload foto (serah terima / pengambilan)
  const handlePhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "handover" | "pickup"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      const url = await uploadImageToCloudinary(file);

      if (type === "handover") {
        setHandoverPhotoUrl(url);
      } else {
        setPickupPhotoUrl(url);
      }

      if (serviceData) {
        const ref = doc(db, "service_requests", serviceData.id);
        await updateDoc(ref, {
          [`${type}_photo_url`]: url,
        });
      }

      setSuccessMsg("Foto berhasil diupload.");
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal upload foto.");
    } finally {
      setSaving(false);
    }
  };

  // 🔄 Update status + log
  const handleUpdateStatus = async () => {
    if (!serviceData) return;
    try {
      setSaving(true);
      const newLog: StatusLog = {
        status,
        updatedBy: user?.email || user?.uid || "unknown",
        updatedAt: new Date(),
      };

      const updatedLog = [...statusLog, newLog];
      setStatusLog(updatedLog);

      const ref = doc(db, "service_requests", serviceData.id);
      await updateDoc(ref, {
        status,
        status_log: updatedLog,
      });

      setSuccessMsg("Status berhasil diperbarui.");
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal update status.");
    } finally {
      setSaving(false);
    }
  };

  // 💾 Simpan estimasi & catatan teknisi
  const handleSaveEstimasiAndNotes = async () => {
    if (!serviceData) return;
    try {
      setSaving(true);
      const ref = doc(db, "service_requests", serviceData.id);
      await updateDoc(ref, {
        estimasi_items: estimasiItems,
        estimasi_total: totalEstimasi,
        teknisi_note: teknisiNote,
      });
      setSuccessMsg("Estimasi harga & catatan teknisi tersimpan.");
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal menyimpan estimasi / catatan.");
    } finally {
      setSaving(false);
    }
  };

  // 🧾 Cetak Nota (pakai print PDF browser)
  const handlePrint = () => {
    if (typeof window === "undefined") return;
    window.print();
  };

  // 📱 Share WhatsApp
  const handleShareWhatsApp = () => {
    if (!serviceData) return;

    const phone = serviceData.no_hp || "";
    const track = serviceData.track_number || "";
    const urlTracking = `${window.location.origin}/tracking/${track}`;

    const text = `Halo, ini informasi service Anda.\n\nTracking: ${track}\nNama: ${serviceData.nama}\nStatus: ${status}\n\nCek detail: ${urlTracking}`;

    const waUrl = `https://wa.me/${phone.replace(
      /[^0-9]/g,
      ""
    )}?text=${encodeURIComponent(text)}`;

    window.open(waUrl, "_blank");
  };

  const formatDateTime = (ts: any) => {
    if (!ts) return "-";
    if (ts.seconds) {
      return new Date(ts.seconds * 1000).toLocaleString("id-ID", {
        dateStyle: "short",
        timeStyle: "short",
      });
    }
    if (ts instanceof Date) {
      return ts.toLocaleString("id-ID", {
        dateStyle: "short",
        timeStyle: "short",
      });
    }
    return "-";
  };

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-300">
        Memuat data...
      </div>
    );
  }

  if (!serviceData) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white">
        <NavbarSwitcher />
        <div className="pt-24 max-w-4xl mx-auto p-6">
          <p className="text-red-400">Data service tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  const isSaving = saving;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0d1117] text-white">
        <NavbarSwitcher />

        <div className="pt-24 max-w-6xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap justify-between gap-4 items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-blue-400 tracking-tight">
                Detail Service - {serviceData.track_number}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Customer:{" "}
                <span className="font-semibold text-white">
                  {serviceData.nama || "-"}
                </span>{" "}
                • No HP: {serviceData.no_hp || "-"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-sm hover:bg-gray-700"
              >
                🧾 Cetak Nota (PDF)
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="px-4 py-2 rounded-lg bg-green-600 text-sm hover:bg-green-700"
              >
                📱 Kirim via WhatsApp
              </button>
            </div>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="bg-red-900/40 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-900/40 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-lg text-sm">
              {successMsg}
            </div>
          )}

          {/* Info Customer & Perangkat */}
          <section className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-4 space-y-2">
              <h2 className="font-semibold text-lg mb-3 text-white">🧍 Data Customer</h2>
              <p className="text-gray-200"><span className="text-gray-400">Nama:</span> {serviceData.nama || "-"}</p>
              <p className="text-gray-200"><span className="text-gray-400">No HP:</span> {serviceData.no_hp || "-"}</p>
              <p className="text-gray-200"><span className="text-gray-400">Email:</span> {serviceData.email || "-"}</p>
              <p className="text-gray-200"><span className="text-gray-400">Alamat:</span> {serviceData.alamat || "-"}</p>
              
              <p className="text-gray-200"><span className="text-gray-400">Penerima Service:</span> {serviceData.penerima_service || "-"}</p>
              <p className="text-gray-200"><span className="text-gray-400">Tanggal Masuk:</span> {formatDateTime(serviceData.timestamp)}</p>
            </div>

            <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-4 space-y-2">
              <h2 className="font-semibold text-lg mb-3 text-white">💻 Data Perangkat</h2>
              <p className="text-gray-200"><span className="text-gray-400">Merk:</span> {serviceData.merk || "-"}</p>
              <p className="text-gray-200"><span className="text-gray-400">Tipe:</span> {serviceData.tipe || "-"}</p>
              <p className="text-gray-200"><span className="text-gray-400">Serial Number:</span> {serviceData.serial_number || "-"}</p>
              <p className="text-gray-200"><span className="text-gray-400">Keluhan:</span> {serviceData.keluhan || "-"}</p>
              <p className="text-gray-200"><span className="text-gray-400">Spesifikasi:</span> {serviceData.spesifikasi_teknis || "-"}</p>
              <p className="text-gray-200"><span className="text-gray-400">Kondisi:</span> {(serviceData.kondisi || []).join(", ") || "-"}</p>
              <p className="text-gray-200"><span className="text-gray-400">Prioritas:</span> {serviceData.prioritas_service || "-"}</p>
            </div>
          </section>

          {/* Status & Log */}
          <section className="bg-gray-800/70 border border-gray-700 rounded-xl p-4 space-y-4">
            <div className="flex flex-wrap gap-4 justify-between items-center">
              <div>
                <h2 className="font-semibold text-lg mb-1">📊 Status Service</h2>
                <p className="text-sm text-gray-400">
                  Ubah status dan simpan sebagai log.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="pending">1. Diagnosa Awal / Pending</option>
                  <option value="process">2. Proses Pengerjaan</option>
                  <option value="waiting_approval">
                    3. Menunggu Konfirmasi Customer
                  </option>
                  <option value="ready">4. Siap Diambil</option>
                  <option value="done">5. Selesai</option>
                  <option value="cancel">9. Batal</option>
                </select>
                <button
                  disabled={isSaving}
                  onClick={handleUpdateStatus}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm disabled:opacity-50"
                >
                  {isSaving ? "Menyimpan..." : "Update Status"}
                </button>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-3">
              <h3 className="font-semibold text-sm mb-2">Riwayat Status</h3>
              {statusLog.length === 0 ? (
                <p className="text-gray-400 text-sm">Belum ada log status.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {statusLog
                    .slice()
                    .reverse()
                    .map((log, idx) => (
                      <li
                        key={idx}
                        className="flex justify-between border border-gray-700/70 rounded-lg px-3 py-2"
                      >
                        <div>
                          <p className="font-semibold">{log.status}</p>
                          {log.note && (
                            <p className="text-gray-400 text-xs">
                              Catatan: {log.note}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-xs text-gray-400">
                          <p>{formatDateTime(log.updatedAt)}</p>
                          <p>{log.updatedBy || "-"}</p>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </section>

          {/* Estimasi Harga + Catatan Teknisi */}
          <section className="bg-gray-800/70 border border-gray-700 rounded-xl p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-lg">💰 Estimasi Harga</h2>
              <button
                onClick={addEstimasiRow}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs"
              >
                + Tambah Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-900/80">
                  <tr>
                    <th className="p-2 border border-gray-700 text-left">
                      Item
                    </th>
                    <th className="p-2 border border-gray-700 text-right">
                      Harga Satuan
                    </th>
                    <th className="p-2 border border-gray-700 text-right">
                      Qty
                    </th>
                    <th className="p-2 border border-gray-700 text-right">
                      Total
                    </th>
                    <th className="p-2 border border-gray-700"></th>
                  </tr>
                </thead>
                <tbody>
                  {estimasiItems.map((row) => (
                    <tr key={row.id}>
                      <td className="p-2 border border-gray-700">
                        <input
                          className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm"
                          value={row.item}
                          onChange={(e) =>
                            handleEstimasiChange(row.id, "item", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2 border border-gray-700">
                        <input
                          className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-right"
                          type="number"
                          min={0}
                          value={row.harga}
                          onChange={(e) =>
                            handleEstimasiChange(row.id, "harga", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2 border border-gray-700">
                        <input
                          className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-right"
                          type="number"
                          min={1}
                          value={row.qty}
                          onChange={(e) =>
                            handleEstimasiChange(row.id, "qty", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2 border border-gray-700 text-right">
                        Rp {row.total.toLocaleString("id-ID")}
                      </td>
                      <td className="p-2 border border-gray-700 text-center">
                        <button
                          onClick={() => removeEstimasiRow(row.id)}
                          className="text-xs text-red-400 hover:text-red-300"
                          type="button"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td
                      colSpan={3}
                      className="p-2 border border-gray-700 text-right font-semibold"
                    >
                      Total
                    </td>
                    <td className="p-2 border border-gray-700 text-right font-semibold">
                      Rp {totalEstimasi.toLocaleString("id-ID")}
                    </td>
                    <td className="p-2 border border-gray-700"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div>
              <label className="block text-sm mb-1">Catatan Teknisi</label>
              <textarea
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                rows={3}
                value={teknisiNote}
                onChange={(e) => setTeknisiNote(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveEstimasiAndNotes}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm disabled:opacity-50"
              >
                {isSaving ? "Menyimpan..." : "Simpan Estimasi & Catatan"}
              </button>
            </div>
          </section>

          {/* Tanda Tangan & Foto */}
          <section className="grid md:grid-cols-2 gap-4">
            {/* Tanda tangan */}
            <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-4 space-y-3">
              <h2 className="font-semibold text-lg">✍️ Tanda Tangan Customer</h2>

              {signatureUrl && (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-1">
                    Tanda tangan tersimpan:
                  </p>
                  <img
                    src={signatureUrl}
                    alt="Signature"
                    className="border border-gray-700 rounded-lg max-h-48 bg-white"
                  />
                </div>
              )}

              <SignatureCanvas
                ref={signatureRef}
                penColor="black"
                canvasProps={{
                  className:
                    "w-full h-40 bg-white rounded-lg border border-gray-600",
                }}
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClearSignature}
                  className="px-3 py-2 rounded-lg bg-gray-700 text-sm hover:bg-gray-600"
                >
                  Hapus
                </button>
                <button
                  type="button"
                  onClick={handleSaveSignature}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm disabled:opacity-50"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Tanda Tangan"}
                </button>
              </div>
            </div>

            {/* Foto serah terima & pengambilan */}
            <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-4 space-y-4">
              <h2 className="font-semibold text-lg">📸 Foto Customer & Unit</h2>

              <div className="space-y-2">
                <p className="text-sm font-semibold">
                  Foto saat serah terima barang
                </p>
                {handoverPhotoUrl && (
                  <img
                    src={handoverPhotoUrl}
                    alt="Foto serah terima"
                    className="border border-gray-700 rounded-lg max-h-40 object-contain bg-black"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoChange(e, "handover")}
                  className="text-xs text-gray-300"
                />
              </div>

              <div className="space-y-2 border-t border-gray-700 pt-3">
                <p className="text-sm font-semibold">
                  Foto saat pengambilan barang
                </p>
                {pickupPhotoUrl && (
                  <img
                    src={pickupPhotoUrl}
                    alt="Foto pengambilan"
                    className="border border-gray-700 rounded-lg max-h-40 object-contain bg-black"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoChange(e, "pickup")}
                  className="text-xs text-gray-300"
                />
              </div>
            </div>
          </section>

          {/* Komentar customer (read only) */}
          <section className="bg-gray-800/70 border border-gray-700 rounded-xl p-4">
            <h2 className="font-semibold text-lg mb-2">
              💬 Komentar Customer (read-only)
            </h2>
            {customerNote ? (
              <p className="text-sm text-gray-200 whitespace-pre-line">
                {customerNote}
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Belum ada komentar dari customer.
              </p>
            )}
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import NotaPembayaran from "@/components/notapembayaran";
import toast, { Toaster } from 'react-hot-toast';

// Interface for props passed to the NotaPembayaran component
interface NotaData {
  nomorNota: string;
  namaCustomer: string;
  noHp: string;
  email: string;
  alamat: string;
  tglTerima: string;
  penerimaService: string;
  prioritasService: string;
  merk: string;
  tipe: string;
  serialNumber: string;
  keluhan: string;
  kondisi: string;
  perlengkapan: string;
  spesifikasiTambahan: string;
  garansi: string;
  tindakanService: { item: string; qty: number; jumlah: number }[];
  biaya: number;
  uangMuka: number;
  sisaPembayaran: number;
  discount: number;
  total: number;
}

// Interface representing the raw data structure from Firestore
interface ServiceData {
    track_number: string;
    nama: string;
    no_hp: string;
    email: string;
    alamat: string;
    timestamp: any;
    penerima_service: string;
    prioritas_service: string;
    merk: string;
    tipe: string;
    serial_number: string;
    keluhan: string;
    kondisi: string[];
    accessories: string[];
    spesifikasi_teknis: string;
    garansi: boolean;
    estimasi_items: { item: string; qty: number; harga: number; total: number }[];
    total_biaya: number; // This might be incorrectly calculated
    dp: number;
}


export default function PrintNotaPage() {
  const params = useParams();
  const docId = (params as any)?.id as string;
  const [notaData, setNotaData] = useState<NotaData | null>(null);
  const [loading, setLoading] = useState(true);

  const setErrorMsg = (msg: string | null) => {
    if (msg) toast.error(msg);
  };

  const formatDateTime = (ts: any) => {
    if (!ts) return "-";
    const date = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
    if (isNaN(date.getTime())) return "-";
    try {
      return date.toLocaleString("id-ID", {
        year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "-";
    }
  };

  useEffect(() => {
    if (!docId) return;

    const loadAndPrepareData = async () => {
      setLoading(true);
      try {
        const ref = doc(db, "service_requests", docId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setErrorMsg("Data tidak ditemukan dengan ID: " + docId);
          notFound();
          return;
        }

        const data = snap.data() as ServiceData;

        // --- CORRECTIVE CALCULATION ---
        const tindakanService = (data.estimasi_items || []).map(item => ({
            item: item.item,
            qty: item.qty,
            jumlah: item.total || (item.harga * item.qty)
        }));

        const correctBiaya = tindakanService.reduce((sum, item) => sum + item.jumlah, 0);
        const uangMuka = data.dp || 0;
        const sisaPembayaran = correctBiaya - uangMuka;
        const total = sisaPembayaran; // Total is the final amount due

        // Transform Firestore data to the NotaData structure with corrected calculations
        const transformedData: NotaData = {
          nomorNota: data.track_number || "N/A",
          namaCustomer: data.nama || "",
          noHp: data.no_hp || "",
          email: data.email || "",
          alamat: data.alamat || "",
          tglTerima: formatDateTime(data.timestamp),
          penerimaService: data.penerima_service || "",
          prioritasService: data.prioritas_service || "",

          merk: data.merk || "",
          tipe: data.tipe || "",
          serialNumber: data.serial_number || "",
          keluhan: data.keluhan || "",
          kondisi: Array.isArray(data.kondisi) ? data.kondisi.join(", ") : "",
          perlengkapan: Array.isArray(data.accessories) ? data.accessories.join(", ") : "",
          spesifikasiTambahan: data.spesifikasi_teknis || "",
          garansi: data.garansi ? "Masih Garansi" : "Habis / Tidak Ada",

          tindakanService: tindakanService,
          biaya: correctBiaya,
          uangMuka: uangMuka,
          sisaPembayaran: sisaPembayaran,
          discount: 0,
          total: total,
        };
        
        setNotaData(transformedData);
      } catch (err) {
        console.error("Data Loading/Transformation Error:", err);
        setErrorMsg("Gagal memuat atau memproses data untuk dicetak.");
      } finally {
        setLoading(false);
      }
    };

    loadAndPrepareData();
  }, [docId]);

  useEffect(() => {
    if (!loading && notaData) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, notaData]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><h1>Mempersiapkan nota untuk dicetak...</h1></div>;
  }

  if (!notaData) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <h1 className="text-xl font-bold text-red-600">Gagal memuat data nota.</h1>
            <p className="mt-2 text-gray-700">Pastikan ID pada URL sudah benar dan data tersedia di database.</p>
            <Toaster position="top-center" />
        </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      <NotaPembayaran data={notaData} />
    </>
  );
}
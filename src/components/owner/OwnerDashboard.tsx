'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { StatCard } from './StatCard';
import { DollarSign, CheckCircle, Clock, List, BarChart, Activity } from 'lucide-react';

// Tipe data sinkron dengan Firestore
interface ServiceData {
  id: string;
  track_number: string;
  nama: string;
  status: 'pending' | 'process' | 'ready' | 'done' | 'waiting_approval' | 'cancel';
  cabang: string;
  updatedAt?: any;
  estimasi_items?: {
    id: string;
    item: string;
    qty: number;
    harga: number;
    total: number;
  }[];
}

interface BranchData {
  name: string;
  pendapatan: number;
  jumlahLayanan: number;
}

const formatCurrency = (value: number) => {
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toFixed(2)}jt`;
  if (value >= 1_000) return `Rp${(value / 1_000).toFixed(0)}rb`;
  return `Rp${value}`;
};

export default function OwnerDashboard() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [completedServices, setCompletedServices] = useState(0);
  const [pendingServices, setPendingServices] = useState(0);
  const [totalServices, setTotalServices] = useState(0);
  const [recentActivity, setRecentActivity] = useState<ServiceData[]>([]);
  const [branchData, setBranchData] = useState<BranchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const servicesRef = collection(db, 'service_requests');

    const unsubscribe = onSnapshot(
      servicesRef,
      (snapshot) => {
        try {
          const allServices = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as ServiceData)
          );

          let revenue = 0;
          let completed = 0;
          const branchStats: Record<string, BranchData> = {};

          // Status selesai sesuai database kamu
          const finishedStatuses = ['done', 'ready'];

          allServices.forEach((service) => {
            if (!service.cabang) return;

            if (!branchStats[service.cabang]) {
              branchStats[service.cabang] = {
                name: service.cabang,
                pendapatan: 0,
                jumlahLayanan: 0,
              };
            }

            // Hitung biaya dari estimasi_items
            const cost =
              service.estimasi_items?.reduce(
                (sum, item) => sum + (item.total || 0),
                0
              ) || 0;

            // Hitung layanan selesai
            if (finishedStatuses.includes(service.status)) {
              completed++;
              revenue += cost;
              branchStats[service.cabang].pendapatan += cost;
            }

            // Tambah total layanan per cabang
            branchStats[service.cabang].jumlahLayanan++;
          });

          setBranchData(
            Object.values(branchStats).sort((a, b) => b.pendapatan - a.pendapatan)
          );
          setTotalServices(allServices.length);
          setCompletedServices(completed);
          setPendingServices(allServices.length - completed);
          setTotalRevenue(revenue);

          // Aktivitas terbaru berdasarkan updatedAt
          const sortedActivity = [...allServices].sort((a, b) => {
            const timeA = a.updatedAt?.toMillis?.() || 0;
            const timeB = b.updatedAt?.toMillis?.() || 0;
            return timeB - timeA;
          });

          setRecentActivity(sortedActivity.slice(0, 5));
          setLoading(false);
        } catch (err) {
          console.error(err);
          setError('Gagal memuat data dashboard.');
          setLoading(false);
        }
      },
      (err) => {
        console.error(err);
        setError('Tidak dapat mengakses data.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ========================= RENDER CONTENT =========================

  const renderContent = () => {
    if (loading) return <div className="py-20 text-center">Loading...</div>;
    if (error) return <div className="py-20 text-center text-red-600">{error}</div>;

    return (
      <>
        {/* ================== STATISTICS ================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Pendapatan"
            value={formatCurrency(totalRevenue)}
            subValue={`dari ${completedServices} layanan`}
            icon={<DollarSign size={24} />}
            color="green"
          />
          <StatCard
            title="Layanan Selesai"
            value={completedServices}
            subValue={`${((completedServices / totalServices) * 100).toFixed(1)}% dari total`}
            icon={<CheckCircle size={24} />}
            color="blue"
          />
          <StatCard
            title="Layanan Pending"
            value={pendingServices}
            subValue={`${((pendingServices / totalServices) * 100).toFixed(1)}% dari total`}
            icon={<Clock size={24} />}
            color="yellow"
          />
          <StatCard
            title="Total Layanan"
            value={totalServices}
            subValue="di semua cabang"
            icon={<List size={24} />}
            color="gray"
          />
        </div>

        {/* ================== PERFORMA CABANG ================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart size={20} /> Performa per Cabang
            </h3>

            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Cabang</th>
                  <th className="px-4 py-2 text-left font-semibold">Pendapatan</th>
                  <th className="px-4 py-2 text-left font-semibold">Total Layanan</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {branchData.map((b) => (
                  <tr key={b.name} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-2 text-gray-800 font-medium">{b.name}</td>
                    <td className="px-4 py-2 text-gray-800">{formatCurrency(b.pendapatan)}</td>
                    <td className="px-4 py-2 text-gray-800">{b.jumlahLayanan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ================== AKTIVITAS TERBARU ================== */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Activity size={20} /> Aktivitas Terbaru
            </h3>

            <ul className="space-y-4">
              {recentActivity.map((service) => (
                <li key={service.id}>
                  <p className="font-semibold text-gray-900">{service.nama}</p>
                  <p className="text-sm text-gray-700">
                    {service.track_number} • {service.cabang} •{' '}
                    <span className="font-medium capitalize">{service.status}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Owner</h1>
      <p className="text-gray-600 mb-8">Ringkasan analitik bisnis dan kinerja</p>

      {renderContent()}
    </motion.div>
  );
}

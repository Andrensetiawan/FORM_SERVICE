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
            subValue={totalServices > 0 ? `${((completedServices / totalServices) * 100).toFixed(1)}% dari total` : "Belum ada data"}
            icon={<CheckCircle size={24} />}
            color="blue"
          />
          <StatCard
            title="Layanan Pending"
            value={pendingServices}
            subValue={totalServices > 0 ? `${((pendingServices / totalServices) * 100).toFixed(1)}% dari total` : "Belum ada data"}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <BarChart size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Performa per Cabang</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Cabang</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Pendapatan</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Total Layanan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {branchData.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-12 text-center">
                        <div className="text-gray-400">
                          <BarChart size={48} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm italic">Belum ada data cabang</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    branchData.map((b, index) => (
                      <motion.tr 
                        key={b.name} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="hover:bg-indigo-50/50 transition-colors duration-200 group"
                      >
                        <td className="px-4 py-4">
                          <span className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                            {b.name}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-bold text-emerald-600">{formatCurrency(b.pendapatan)}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {b.jumlahLayanan} layanan
                          </span>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ================== AKTIVITAS TERBARU ================== */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg">
                <Activity size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Aktivitas Terbaru</h3>
            </div>

            <ul className="space-y-3">
              {recentActivity.length === 0 ? (
                <li className="text-center py-8">
                  <Activity size={48} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-400 italic">Belum ada aktivitas terbaru</p>
                </li>
              ) : (
                recentActivity.map((service, index) => (
                  <motion.li 
                    key={service.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200 border border-transparent hover:border-gray-200"
                  >
                    <p className="font-bold text-gray-900 mb-1">{service.nama}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
                      <span className="font-mono font-semibold text-indigo-600">{service.track_number}</span>
                      <span className="text-gray-400">•</span>
                      <span className="font-medium">{service.cabang}</span>
                      <span className="text-gray-400">•</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
                        ${
                          service.status === 'done' ? 'bg-green-100 text-green-800' :
                          service.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                          service.status === 'process' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      `}>
                        {service.status}
                      </span>
                    </div>
                  </motion.li>
                ))
              )}
            </ul>
          </div>
        </div>
      </>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent mb-3">
          Dashboard Owner
        </h1>
        <p className="text-gray-600 text-lg">Ringkasan analitik bisnis dan kinerja perusahaan</p>
      </div>

      {renderContent()}
    </motion.div>
  );
}

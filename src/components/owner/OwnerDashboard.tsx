
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { StatCard } from './StatCard';
import { DollarSign, CheckCircle, Clock, List, BarChart, Activity } from 'lucide-react';
import { ROLES } from '@/lib/roles';

// Definisikan tipe data yang lebih akurat
interface ServiceData {
  id: string;
  track_number: string;
  nama: string;
  status: 'pending' | 'dikerjakan' | 'selesai' | 'diambil' | 'cancel';
  cabang: string;
  total_biaya?: number;
  dp?: number;
  updatedAt: any; // Firestore Timestamp
}

interface BranchData {
  name: string;
  pendapatan: number;
  jumlahLayanan: number;
}

const formatCurrency = (value: number) => {
  if (value >= 1_000_000) {
    return `Rp${(value / 1_000_000).toFixed(2)}jt`;
  }
  if (value >= 1_000) {
    return `Rp${(value / 1_000).toFixed(0)}rb`;
  }
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
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const servicesCollection = collection(db, 'services');
        const servicesSnapshot = await getDocs(servicesCollection);
        
        const allServices: ServiceData[] = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceData));

        let revenue = 0;
        let completed = 0;
        const branchStats: { [key: string]: { pendapatan: number, jumlahLayanan: number } } = {};

        allServices.forEach(service => {
          if (service.cabang && !branchStats[service.cabang]) {
            branchStats[service.cabang] = { pendapatan: 0, jumlahLayanan: 0 };
          }
          
          if (service.status === 'selesai' || service.status === 'diambil') {
            completed++;
            const cost = service.total_biaya || 0;
            revenue += cost;
            if (service.cabang) {
                branchStats[service.cabang].pendapatan += cost;
            }
          }
          
          if (service.cabang) {
            branchStats[service.cabang].jumlahLayanan++;
          }
        });

        const formattedBranchData = Object.keys(branchStats).map(key => ({
          name: key,
          pendapatan: branchStats[key].pendapatan,
          jumlahLayanan: branchStats[key].jumlahLayanan
        })).sort((a, b) => b.pendapatan - a.pendapatan);
        
        setBranchData(formattedBranchData);
        setTotalServices(allServices.length);
        setCompletedServices(completed);
        setPendingServices(allServices.length - completed);
        setTotalRevenue(revenue);
        
        // Sort by updatedAt timestamp for recent activity
        const sortedServices = allServices.sort((a, b) => {
            const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
            const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
            return timeB - timeA;
        });
        setRecentActivity(sortedServices.slice(0, 5));

      } catch (err) {
        console.error('Error fetching owner dashboard data:', err);
        setError('Gagal memuat data dasbor. Silakan coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-lg h-32 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-8 bg-gray-300 rounded w-1/2 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg h-64 animate-pulse"></div>
            <div className="bg-white p-6 rounded-xl shadow-lg h-64 animate-pulse"></div>
          </div>
        </>
      );
    }

    if (error) {
      return (
        <div className="text-center py-20 bg-red-50 text-red-700 rounded-lg">
          <p>{error}</p>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Pendapatan" value={formatCurrency(totalRevenue)} subValue={`dari ${completedServices} layanan`} icon={<DollarSign size={24} />} color="green" />
          <StatCard title="Layanan Selesai" value={completedServices} subValue={`${((completedServices/totalServices)*100 || 0).toFixed(1)}% dari total`} icon={<CheckCircle size={24} />} color="blue" />
          <StatCard title="Layanan Pending" value={pendingServices} subValue={`${((pendingServices/totalServices)*100 || 0).toFixed(1)}% dari total`} icon={<Clock size={24} />} color="yellow" />
          <StatCard title="Total Layanan" value={totalServices} subValue="di semua cabang" icon={<List size={24} />} color="indigo" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><BarChart size={20} /> Performa per Cabang</h3>
            {branchData.length > 0 ? (
               <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-3 font-semibold text-gray-600 text-sm">Cabang</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 text-sm">Pendapatan</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 text-sm">Total Layanan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {branchData.map(branch => (
                            <tr key={branch.name} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-4 font-medium text-gray-800">{branch.name}</td>
                                <td className="px-4 py-4 text-gray-700 font-semibold">{formatCurrency(branch.pendapatan)}</td>
                                <td className="px-4 py-4 text-gray-700">{branch.jumlahLayanan}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
               </div>
            ) : (
               <div className="h-48 flex items-center justify-center text-gray-500">
                 Data pendapatan per cabang tidak ditemukan.
               </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Activity size={20} /> Aktivitas Terbaru</h3>
            <ul className="space-y-4">
                {recentActivity.length > 0 ? recentActivity.map((service) => (
                   <li key={service.id} className="flex items-center space-x-3">
                     <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${service.status === 'selesai' || service.status === 'diambil' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                       {service.cabang.substring(0,2).toUpperCase()}
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-medium text-gray-800 truncate">{service.nama}</p>
                       <p className="text-sm text-gray-500 truncate">{service.track_number} &bull; {service.cabang}</p>
                     </div>
                     <div className="text-sm font-semibold text-gray-700">
                        {formatCurrency(service.total_biaya || 0)}
                     </div>
                   </li>
                 )) : <p className="text-center text-gray-500 py-10">Tidak ada aktivitas terbaru.</p>}
               </ul>
          </div>
        </div>
      </>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Dashboard Owner</h1>
        <p className="text-gray-500 mt-1">Ringkasan Analitik Bisnis & Kinerja</p>
      </div>
      {renderContent()}
    </motion.div>
  );
}

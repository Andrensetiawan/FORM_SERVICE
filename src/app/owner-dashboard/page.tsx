'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, query, where, getCountFromServer } from 'firebase/firestore';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import NavbarSwitcher from '@/app/components/navbars/NavbarSwitcher';
import { motion } from 'framer-motion';
import { ROLES } from '@/lib/roles';

export default function OwnerDashboard() {
  const [stats, setStats] = useState({
    totalRequests: 0,
    completedRequests: 0,
    pendingRequests: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total service requests
        const reqCountSnap = await getCountFromServer(query(collection(db, 'service_requests')));
        const totalRequests = reqCountSnap.data().count;

        // Get completed requests
        const completedQuery = query(
          collection(db, 'service_requests'),
          where('status', '==', 'Selesai')
        );
        const completedCountSnap = await getCountFromServer(completedQuery);
        const completedRequests = completedCountSnap.data().count;

        // Calculate pending requests
        const pendingRequests = totalRequests - completedRequests;

        setStats({
          totalRequests,
          completedRequests,
          pendingRequests,
          totalRevenue: completedRequests * 150000, // Contoh: rata-rata pendapatan per service
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <ProtectedRoute allowedRoles={['owner']}>
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100">
        <NavbarSwitcher />
        
        <main className="max-w-7xl mx-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-8 py-6">
              <h1 className="text-3xl font-bold">Owner Dashboard</h1>
              <p className="text-blue-100 mt-2">Business Analytics & KPI Monitoring</p>
            </div>

            {/* Stats Cards */}
            {loading ? (
              <div className="p-12 text-center text-gray-600">
                Memuat statistik...
              </div>
            ) : (
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                  {/* Total Requests Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-br from-blue-100 to-blue-200 p-6 rounded-xl border border-blue-300 shadow-sm"
                  >
                    <h3 className="text-gray-800 font-medium mb-1">Total Requests</h3>
                    <p className="text-3xl font-bold text-blue-800">{stats.totalRequests}</p>
                    <div className="mt-3 h-2 bg-blue-300 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-700"
                        style={{ width: `${stats.totalRequests > 0 ? 100 : 0}%` }}
                      ></div>
                    </div>
                  </motion.div>

                  {/* Completed Requests Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="bg-gradient-to-br from-green-100 to-green-200 p-6 rounded-xl border border-green-300 shadow-sm"
                  >
                    <h3 className="text-gray-800 font-medium mb-1">Selesai</h3>
                    <p className="text-3xl font-bold text-green-800">{stats.completedRequests}</p>
                    <div className="mt-3 h-2 bg-green-300 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-700"
                        style={{ width: `${stats.totalRequests > 0 ? (stats.completedRequests / stats.totalRequests) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </motion.div>

                  {/* Pending Requests Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="bg-gradient-to-br from-yellow-100 to-yellow-200 p-6 rounded-xl border border-yellow-300 shadow-sm"
                  >
                    <h3 className="text-gray-800 font-medium mb-1">Pending</h3>
                    <p className="text-3xl font-bold text-yellow-800">{stats.pendingRequests}</p>
                    <div className="mt-3 h-2 bg-yellow-300 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-700"
                        style={{ width: `${stats.totalRequests > 0 ? (stats.pendingRequests / stats.totalRequests) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </motion.div>

                  {/* Revenue Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="bg-gradient-to-br from-purple-100 to-purple-200 p-6 rounded-xl border border-purple-300 shadow-sm"
                  >
                    <h3 className="text-gray-800 font-medium mb-1">Pendapatan</h3>
                    <p className="text-3xl font-bold text-purple-800">Rp {stats.totalRevenue.toLocaleString()}</p>
                    <div className="mt-3 h-2 bg-purple-300 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-700" style={{ width: '75%' }}></div>
                    </div>
                  </motion.div>
                </div>

                {/* Charts Placeholder */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-gray-100 p-6 rounded-xl border border-gray-300">
                    <h3 className="font-semibold text-gray-900 mb-4">Statistik Berdasarkan Cabang</h3>
                    <div className="h-64 bg-white rounded-lg border border-gray-300 flex items-center justify-center text-gray-600">
                      Grafik statistik per cabang akan muncul di sini
                    </div>
                  </div>

                  <div className="bg-gray-100 p-6 rounded-xl border border-gray-300">
                    <h3 className="font-semibold text-gray-900 mb-4">Tren Service Request</h3>
                    <div className="h-64 bg-white rounded-lg border border-gray-300 flex items-center justify-center text-gray-600">
                      Grafik tren service request akan muncul di sini
                    </div>
                  </div>
                </div>

                {/* Recent Requests */}
                <div className="mt-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Service Request Terbaru</h3>
                  <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="py-3 px-4 text-left text-sm font-semibold text-gray-800">No. Tracking</th>
                          <th className="py-3 px-4 text-left text-sm font-semibold text-gray-800">Nama Customer</th>
                          <th className="py-3 px-4 text-left text-sm font-semibold text-gray-800">Status</th>
                          <th className="py-3 px-4 text-left text-sm font-semibold text-gray-800">Cabang</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-300">
                        <tr>
                          <td className="py-3 px-4 text-sm text-gray-900">ACS001</td>
                          <td className="py-3 px-4 text-sm text-gray-900">Andi Prasetyo</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-200 text-green-800">Selesai</span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">Jakarta</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 text-sm text-gray-900">ACS002</td>
                          <td className="py-3 px-4 text-sm text-gray-900">Budi Santoso</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-200 text-yellow-800">Proses</span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">Bandung</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
"use client";

import { motion } from "framer-motion";
import {
  Info,
  GitMerge,
  FileText,
  Users,
  ChevronLeft,
  Heart,
} from "lucide-react";
import NavbarSwitcher from "@/components/navbars/NavbarSwitcher";
import { useRouter } from "next/navigation";
import packageJson from "../../../../../package.json"; // Adjust path as needed

const InfoCard = ({
  icon,
  title,
  value,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
}) => {
  const Icon = icon;
  return (
    <div className="flex items-center gap-4 rounded-lg bg-gray-100 p-4">
      <Icon className="h-8 w-8 flex-shrink-0 text-blue-600" />
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-lg font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

export default function AboutPage() {
  const router = useRouter();
  const appVersion = packageJson.version;
  const appName = packageJson.name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  return (
    <>
      <NavbarSwitcher />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft size={24} className="text-gray-600" />
              </button>
              <h1 className="text-3xl font-extrabold text-gray-900">
                Tentang Aplikasi
              </h1>
            </div>
            <p className="text-gray-600 text-lg ml-14 -mt-4">
              Informasi versi, lisensi, dan pengembang aplikasi.
            </p>
          </motion.div>

          <motion.div
            className="mt-10 bg-white p-8 rounded-2xl shadow-lg border"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* App Info */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">{appName}</h2>
              <p className="text-gray-500">
                Solusi Manajemen Layanan Terintegrasi
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InfoCard icon={Info} title="Nama Aplikasi" value={appName} />
              <InfoCard icon={GitMerge} title="Versi" value={appVersion} />
              <InfoCard icon={FileText} title="Lisensi" value="Proprietary" />
              <InfoCard
                icon={Users}
                title="Pengembang"
                value="PT. Anak Usaha Mandiri"
              />
            </div>

            {/* Acknowledgements */}
            <div className="mt-12 pt-8 border-t">
              <h3 className="text-xl font-bold text-center text-gray-800 mb-6">
                Acknowledgements
              </h3>
              <p className="text-center text-gray-600">
                Aplikasi ini dibangun dengan cinta menggunakan teknologi open-source
                terbaik. Kami berterima kasih kepada para kontributor dari:
              </p>
              <div className="flex justify-center items-center gap-6 mt-6 flex-wrap">
                <span className="font-semibold text-gray-700">React</span>
                <span className="font-semibold text-gray-700">Next.js</span>
                <span className="font-semibold text-gray-700">Firebase</span>
                <span className="font-semibold text-gray-700">Tailwind CSS</span>
                <span className="font-semibold text-gray-700">Lucide</span>
                <span className="font-semibold text-gray-700">Cloudinary</span>
              </div>
               <div className="flex justify-center items-center gap-2 mt-8 text-gray-500">
                    <Heart size={16} />
                    <p>Made for better service management.</p>
               </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

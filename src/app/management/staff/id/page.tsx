"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { motion } from "framer-motion";
import { UserCog, Mail, ShieldCheck, Clock } from "lucide-react";

export default function StaffDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [staff, setStaff] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, "users", id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setStaff(docSnap.data());
    };
    fetchData();
  }, [id]);

  if (!staff) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Memuat data staff...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12 px-6 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto bg-white rounded-3xl shadow-lg p-8"
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Detail Staff
        </h1>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <UserCog className="w-6 h-6 text-blue-600" />
            <p className="text-gray-700 font-medium">{staff.name}</p>
          </div>

          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-blue-600" />
            <p className="text-gray-600">{staff.email}</p>
          </div>

          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-green-600" />
            <p className="capitalize">{staff.role}</p>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-gray-500" />
            <p className="text-gray-500">
              Bergabung sejak: {staff.createdAt || "Tidak diketahui"}
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push("/management/staff")}
          className="mt-8 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition"
        >
          Kembali
        </button>
      </motion.div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function Staff() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApprovedStaff = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("role", "==", "staff"),
          where("approved", "==", true)
        );

        const querySnapshot = await getDocs(q);
        const staffData: any[] = [];
        querySnapshot.forEach((doc) => {
          staffData.push({ id: doc.id, ...doc.data() });
        });
        setStaffList(staffData);
      } catch (error) {
        console.error("Error fetching staff list:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedStaff();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Memuat data staff...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Daftar Staff Aktif</h1>

      {staffList.length === 0 ? (
        <p className="text-gray-500">Belum ada staff yang disetujui.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map((staff) => (
            <Card
              key={staff.id}
              className="hover:shadow-lg transition-shadow duration-200 border border-gray-200"
            >
              <CardHeader>
                <CardTitle className="text-lg font-medium">
                  {staff.name || "Tanpa Nama"}
                </CardTitle>
                <p className="text-sm text-gray-500">{staff.email}</p>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Role:</span>
                  <span className="font-medium text-gray-800">{staff.role}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">Bergabung:</span>
                  <span className="text-gray-500">
                    {new Date(staff.createdAt).toLocaleDateString("id-ID")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

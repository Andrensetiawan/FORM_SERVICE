"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import NavbarSwitcher from "@/app/components/navbars/NavbarSwitcher";
import useAuth from "@/hooks/useAuth";
import { ROLES } from "@/lib/roles";
import { createLog } from "@/lib/log";

interface Props {
  params: { id: string };
}

export default function CabangDetailPage({ params }: Props) {
  const { id } = params;
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const [cabang, setCabang] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // ================================================================
  // FETCH CABANG + STAFF
  // ================================================================
  const fetchData = async () => {
    setLoadingData(true);

    try {
      // get cabang
      const cabangDoc = await getDoc(doc(db, "cabangs", id));
      if (!cabangDoc.exists()) {
        setCabang(null);
        return;
      }

      const cabangData = { id: cabangDoc.id, ...cabangDoc.data() };
      setCabang(cabangData);

      // get staff
     const staffSnap = await getDocs(
  query(
    collection(db, "users"),
    where("cabang", "==", cabangData.id)
  )
);


      const arr: any[] = [];
      staffSnap.forEach((s) => arr.push({ uid: s.id, ...s.data() }));
      setStaff(arr);
    } catch (err) {
      console.error("Error fetch detail cabang:", err);
    }

    setLoadingData(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // protect route
 if (!loading && role !== ROLES.ADMIN) {
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
      <></>
    </ProtectedRoute>
  );
}


  // ================================================================
  // PROMOTE STAFF → MANAGER
  // ================================================================
  const promoteToManager = async (u: any) => {
    if (!cabang) return;

    const confirmMsg = confirm(
      `Jadikan ${u.name} sebagai Manager cabang "${cabang.name}"?`
    );
    if (!confirmMsg) return;

    try {
      // 1. update user
      await updateDoc(doc(db, "users", u.uid), {
        role: "manager",
        cabang: cabang.name,
      });

      // 2. downgrade manager lama
      if (cabang.managerId && cabang.managerId !== u.uid) {
        await updateDoc(doc(db, "users", cabang.managerId), {
          role: "staff",
          cabang: "",
        });
      }

      // 3. update cabang
      await updateDoc(doc(db, "cabangs", cabang.id), {
        managerId: u.uid,
        managerName: u.name,
        managerEmail: u.email,
      });

      // 4. log
      await createLog({
        uid: user?.uid ?? "",
        role: role ?? "unknown",
        action: "promote_staff_to_manager",
        detail: `Promoted ${u.email} to manager of ${cabang.name}`,
        target: u.email,
      });

      alert("Berhasil menjadikan Manager baru!");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal promote manager.");
    }
  };

  // ================================================================
  // RENDER UI
  // ================================================================
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16">
        <NavbarSwitcher />

        <div className="max-w-4xl mx-auto px-6 py-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            📍 Detail Cabang
          </h1>

          {loadingData ? (
            <div className="text-center py-10 text-gray-600 font-semibold">
              Memuat data cabang...
            </div>
          ) : !cabang ? (
            <div className="text-center py-10 text-gray-500">
              Cabang tidak ditemukan.
            </div>
          ) : (
            <>
              {/* CABANG HEADER */}
              <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-gray-100">
                <h2 className="text-3xl font-bold text-gray-900">
                  {cabang.name}
                </h2>

                <p className="mt-3 text-blue-700 font-semibold">
                  Manager:{" "}
                  {cabang.managerName ? (
                    <>
                      {cabang.managerName}{" "}
                      <span className="text-gray-600">
                        ({cabang.managerEmail})
                      </span>
                    </>
                  ) : (
                    "-"
                  )}
                </p>
              </div>

              {/* STAFF LIST */}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">
                  👥 Staff Cabang ({staff.length})
                </h3>

                {staff.length === 0 ? (
                  <p className="text-gray-500">Belum ada staff.</p>
                ) : (
                  <div className="space-y-4">
                    {staff.map((s) => {
                      const isOnline =
                        s.lastActive &&
                        Date.now() - s.lastActive.toMillis() < 1000 * 60 * 5; // 5 menit aktif

                      return (
                        <div
                          key={s.uid}
                          className="flex justify-between items-center border-b pb-4"
                        >
                          <div>
                            <p className="font-semibold text-gray-900 text-lg">
                              {s.name}
                            </p>

                            <p className="text-sm text-gray-600">{s.email}</p>

                            <p className="text-xs text-gray-500 mt-1">
                              Role:{" "}
                              <span className="font-semibold text-gray-700">
                                {s.role}
                              </span>
                            </p>

                            {/* STATUS BADGE */}
                            <span
                              className={`mt-2 inline-block px-2 py-1 text-xs rounded-lg ${
                                isOnline
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {isOnline ? "Online" : "Offline"}
                            </span>
                          </div>

                          {/* PROMOTE BUTTON */}
                          <div>
                            {s.role !== "manager" && (
                              <button
                                onClick={() => promoteToManager(s)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition"
                              >
                                Promote → Manager
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

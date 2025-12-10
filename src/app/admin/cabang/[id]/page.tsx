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
import { db, auth } from "@/lib/firebaseConfig";
import ProtectedRoute from "@/components/ProtectedRoute";
import NavbarSwitcher from "@/components/navbars/NavbarSwitcher";
import useAuth from "@/hooks/useAuth";
import { ROLES } from "@/lib/roles";
import { createLog } from "@/lib/log";
import { Trash2 } from "lucide-react";

export default function CabangDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const [cabang, setCabang] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const cabangDoc = await getDoc(doc(db, "cabangs", id));
      if (!cabangDoc.exists()) {
        setCabang(null);
        setLoadingData(false);
        return;
      }

      const cabangData = { id: cabangDoc.id, ...cabangDoc.data() };
      setCabang(cabangData);

      const staffSnap = await getDocs(
        query(collection(db, "users"), where("cabang", "==", cabangData.id))
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

  if (!loading && role !== ROLES.ADMIN && role !== ROLES.OWNER && role !== ROLES.MANAGER) {
    return (
      <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER]}>
        <></>
      </ProtectedRoute>
    );
  }

  const handleRemoveManager = async (cabangData: any) => {
    if (!cabangData?.managerId) {
      alert("Tidak ada manager untuk cabang ini.");
      return;
    }

    try {
      await updateDoc(doc(db, "users", cabangData.managerId), {
        role: "staff",
        cabang: "",
      });

      await updateDoc(doc(db, "cabangs", cabangData.id), {
        managerId: "",
        managerName: "",
        managerEmail: "",
      });

            await createLog({

              uid: auth.currentUser?.uid ?? "",

              role: role ?? "unknown",

              action: "remove_manager",

              detail: `Removed manager from cabang ${cabangData.name}`,

              target: cabangData.managerId,

            });

      alert("Manager berhasil dihapus!");
      fetchData();
    } catch (err) {
      console.error("ERROR REMOVE MANAGER:", err);
      alert("Terjadi kesalahan.");
    }
  };

  const promoteToManager = async (u: any) => {
    if (!cabang) return;

    if (!confirm(`Jadikan ${u.name} Manager cabang "${cabang.name}"?`)) return;

    try {
      await updateDoc(doc(db, "users", u.uid), {
        role: "manager",
        cabang: cabang.name,
      });

      if (cabang.managerId && cabang.managerId !== u.uid) {
        await updateDoc(doc(db, "users", cabang.managerId), {
          role: "staff",
          cabang: "",
        });
      }

      await updateDoc(doc(db, "cabangs", cabang.id), {
        managerId: u.uid,
        managerName: u.name,
        managerEmail: u.email,
      });

      await createLog({
        uid: user?.uid ?? "",
        role: role ?? "unknown",
        action: "promote_staff_to_manager",
        detail: `Promoted ${u.email} to manager of ${cabang.name}`,
        target: u.uid,
      });

      alert("Berhasil!");
      fetchData();
    } catch (err) {
      console.error("Error promote:", err);
      alert("Gagal promote manager.");
    }
  };

  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER]}>
      <div className="min-h-screen bg-gray-50 pt-16">
        <NavbarSwitcher />

        <div className="max-w-4xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Detail Cabang
          </h1>

          {loadingData ? (
            <p>Memuat data...</p>
          ) : !cabang ? (
            <p>Cabang tidak ditemukan.</p>
          ) : (
            <>
              <div className="bg-white p-6 rounded-xl shadow mb-8">
                <h2 className="text-2xl font-bold text-gray-800">
                  {cabang.name}
                </h2>

                <p className="mt-3 text-gray-700 font-medium">
                  Manager:{" "}
                  {cabang.managerName ? (
                    <>
                      {cabang.managerName} ({cabang.managerEmail})
                      <button
                        onClick={() => handleRemoveManager(cabang)}
                        className="ml-3 px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        <Trash2 size={14} /> Hapus
                      </button>
                    </>
                  ) : (
                    "-"
                  )}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="text-xl font-bold mb-4">Staff Cabang</h3>

                {staff.length === 0 ? (
                  <p>Belum ada staff.</p>
                ) : (
                  staff.map((s) => (
                    <div
                      key={s.uid}
                      className="flex justify-between items-center border-b py-3"
                    >
                      <div>
                        <p className="font-semibold">{s.name}</p>
                        <p className="text-sm text-gray-600">{s.email}</p>
                      </div>

                      {s.role !== "manager" && (
                        <button
                          onClick={() => promoteToManager(s)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                        >
                          Promote → Manager
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

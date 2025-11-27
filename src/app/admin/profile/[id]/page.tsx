"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import Image from "next/image";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import NavbarSwitcher from "@/app/components/navbars/NavbarSwitcher";
import { ROLES } from "@/lib/roles";
import { ArrowLeft, Save, X } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import toast from "react-hot-toast";

export default function StaffDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, role, loading } = useAuth();

  const [staff, setStaff] = useState<any>(null);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);

  // preset jabatan sesuai yang pernah kamu pakai
  const JABATAN_OPTIONS = [
    "teknisi",
    "sales",
    "admin",
    "GA",
    "finance",
    "IT",
    "kasir",
    "marketing",
  ];

  // editable fields
  const [newRole, setNewRole] = useState<string>("");
  const [jabatan, setJabatan] = useState<string>("");

  // -----------------------
  // Fetch staff data
  // -----------------------
  useEffect(() => {
    const fetchStaff = async () => {
      setLoadingStaff(true);
      try {
        const ref = doc(db, "users", id as string);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          toast.error("Staff tidak ditemukan.");
          router.push("/management/staff");
          return;
        }

        const data = snap.data();
        setStaff({ id: snap.id, ...data });
        setNewRole((data.role as string) || "");
        setJabatan((data.jabatan as string) || "");
      } catch (err) {
        console.error("Fetch staff error:", err);
        toast.error("Gagal mengambil data staff.");
      } finally {
        setLoadingStaff(false);
      }
    };

    if (id) fetchStaff();
  }, [id, router]);

  // -----------------------
  // Fetch service requests assigned to this staff
  // -----------------------
  useEffect(() => {
    const fetchAssigned = async () => {
      try {
        const q = query(
          collection(db, "service_requests"),
          where("assignedTo", "==", id as string)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setServiceRequests(list);
      } catch (err) {
        console.error("Fetch service requests error:", err);
      }
    };

    if (id) fetchAssigned();
  }, [id]);

  // -----------------------
  // Permission guard local (complement ProtectedRoute)
  // -----------------------
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/");
        return;
      }
      if (![ROLES.MANAGER, ROLES.OWNER, ROLES.ADMIN].includes(role as any)) {
        router.replace("/unauthorized");
      }
    }
  }, [loading, user, role, router]);

  // -----------------------
  // Update role
  // -----------------------
  const updateStaffRole = async () => {
    if (!newRole) {
      toast.error("Pilih role terlebih dahulu.");
      return;
    }
    try {
      await updateDoc(doc(db, "users", id as string), { role: newRole });
      setStaff((prev: any) => ({ ...prev, role: newRole }));
      toast.success("Role staff berhasil diperbarui!");
    } catch (err) {
      console.error("Update role error:", err);
      toast.error("Gagal memperbarui role staff.");
    }
  };

  // -----------------------
  // Update jabatan
  // -----------------------
  const updateJabatan = async () => {
    try {
      await updateDoc(doc(db, "users", id as string), { jabatan });
      setStaff((prev: any) => ({ ...prev, jabatan }));
      toast.success("Jabatan staff berhasil diperbarui!");
    } catch (err) {
      console.error("Update jabatan error:", err);
      toast.error("Gagal memperbarui jabatan.");
    }
  };

  // -----------------------
  // Delete staff
  // -----------------------
  const deleteStaff = async () => {
    if (!confirm("⚠️ Apakah Anda yakin ingin menghapus staff ini?")) return;
    try {
      await deleteDoc(doc(db, "users", id as string));
      toast.success("Staff berhasil dihapus.");
      router.push("/management/staff");
    } catch (err) {
      console.error("Delete staff error:", err);
      toast.error("Gagal menghapus staff.");
    }
  };

  // -----------------------
  // Loading / not found
  // -----------------------
  if (loading || loadingStaff) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-700">
        Memuat data staff...
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-700">
        Staff tidak ditemukan..
      </div>
    );
  }

  // role badge colors
  const roleColors: Record<string, string> = {
    admin: "bg-blue-200 text-blue-800",
    owner: "bg-purple-200 text-purple-800",
    manager: "bg-green-200 text-green-800",
    staff: "bg-orange-200 text-orange-800",
    user: "bg-gray-200 text-gray-700",
  };

  // helper to safely format Firestore timestamps
  const fmtTs = (ts: any) => {
    if (!ts) return "-";
    if (typeof ts.toDate === "function") return ts.toDate().toLocaleString();
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    return String(ts);
  };

  // helper to produce safe avatar url (Cloudinary smart transforms) — fall back to default
  const avatarSrc = (url?: string) => {
    if (!url) return "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    try {
      // if cloudinary path contains /upload/ we inject optimization
      if (url.includes("/upload/")) {
        return url.replace("/upload/", "/upload/f_auto,q_auto,w_400,h_400,c_fill/");
      }
      return url;
    } catch {
      return url;
    }
  };

  return (
    <ProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.OWNER, ROLES.ADMIN]}>
      <div className="min-h-screen bg-gray-50">
        <NavbarSwitcher />

        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link href="/management/staff" className="flex items-center text-blue-600 mb-6 hover:underline">
            <ArrowLeft size={18} />
            <span className="ml-2">Kembali ke Daftar Staff</span>
          </Link>

          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex-shrink-0">
                {/* Use simple <img> to avoid Next/image domain issues in dev */}
                <Image
                src={
                  staff.photoURL && staff.photoURL.startsWith("http")
                    ? staff.photoURL
                    : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                }
                width={120}
                height={120}
                alt="Staff Avatar"
                unoptimized
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                }}
                className="rounded-full border-4 border-blue-400 object-cover w-32 h-32"
              />
              </div>

              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{staff.name || staff.email}</h1>

                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${roleColors[staff.role] || roleColors.staff}`}>
                    {String(staff.role || "staff").toUpperCase()}
                  </span>

                  {staff.online ? (
                    <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">Online</span>
                  ) : (
                    <span className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-full">Offline</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-gray-700">
                  <div>
                    <p className="mb-1"><span className="font-semibold">Email:</span> {staff.email || "-"}</p>
                    <p className="mb-1"><span className="font-semibold">No HP:</span> {staff.no_hp || "-"}</p>
                    <p className="mb-1"><span className="font-semibold">Alamat:</span> {staff.alamat || "-"}</p>
                    <p className="mb-1"><span className="font-semibold">Jabatan:</span> {staff.jabatan || "-"}</p>
                  </div>
                  <div>
                    <p className="mb-1"><span className="font-semibold">Cabang:</span> {staff.cabang || "-"}</p>
                    <p className="mb-1"><span className="font-semibold">Dibuat:</span> {fmtTs(staff.createdAt)}</p>
                    <p className="mb-1"><span className="font-semibold">Terakhir Aktif:</span> {fmtTs(staff.lastActive)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Pengaturan Staff</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Role */}
                <div>
                  <label className="font-medium">Role Staff</label>
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full border p-2 rounded-lg mt-1">
                    <option value="">-- Pilih Role --</option>
                    <option value="staff">staff</option>
                    <option value="manager">manager</option>
                    <option value="owner">owner</option>
                    <option value="admin">admin</option>
                  </select>

                  <button onClick={updateStaffRole} className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex gap-2 items-center">
                    <Save size={16} /> Update Role
                  </button>
                </div>

                {/* Jabatan */}
                <div>
                  <label className="font-medium">Jabatan Staff</label>
                  <select value={jabatan} onChange={(e) => setJabatan(e.target.value)} className="w-full border p-2 rounded-lg mt-1">
                    <option value="">-- Pilih Jabatan --</option>
                    {JABATAN_OPTIONS.map((j) => (
                      <option key={j} value={j}>
                        {j.charAt(0).toUpperCase() + j.slice(1)}
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-2 mt-3">
                    <button onClick={updateJabatan} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
                      <Save size={16} /> Update Jabatan
                    </button>
                    <button onClick={() => { setJabatan(""); }} className="bg-gray-200 text-gray-800 px-3 py-2 rounded-lg">Reset</button>
                  </div>
                </div>
              </div>

              <button onClick={deleteStaff} className="mt-6 bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2">
                <X size={18} /> Hapus Staff
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Service Request Ditangani</h2>

            {serviceRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Tidak ada service request yang ditangani oleh staff ini.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-4 text-left">Tracking</th>
                      <th className="py-2 px-4 text-left">Customer</th>
                      <th className="py-2 px-4 text-left">Status</th>
                      <th className="py-2 px-4 text-left">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceRequests.map((r) => (
                      <tr key={r.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">{r.track_number || r.id}</td>
                        <td className="py-2 px-4">{r.nama || "-"}</td>
                        <td className="py-2 px-4">{r.status || "-"}</td>
                        <td className="py-2 px-4">{fmtTs(r.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
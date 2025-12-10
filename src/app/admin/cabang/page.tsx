"use client";

import { useEffect, useState, useCallback } from "react";
import { collection, getDocs, query, where, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { createLog } from "@/lib/log";
import useAuth from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import NavbarSwitcher from "@/components/navbars/NavbarSwitcher";
import { ROLES } from "@/lib/roles";
import { Plus, Search, Users } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function AdminCabangPage() {
  const { user, role, loading } = useAuth();

  const [cabangs, setCabangs] = useState<any[]>([]);
  const [staffMap, setStaffMap] = useState<Record<string, any[]>>({});
  const [managers, setManagers] = useState<any[]>([]);
  const [loadingCabangs, setLoadingCabangs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCabang, setNewCabang] = useState("");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCabangs = useCallback(async () => {
    setLoadingCabangs(true);
    try {
      const snap = await getDocs(collection(db, "cabangs"));
      const arr: any[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      arr.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setCabangs(arr);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCabangs(false);
    }
  }, []);

  const fetchManagers = useCallback(async () => {
    try {
      const q = query(collection(db, "users"), where("approved", "==", true));
      const snap = await getDocs(q);
      const arr: any[] = [];
      snap.forEach((d) => {
        const raw = d.data() as any;
        if (String(raw.role).toLowerCase() === "manager") {
          arr.push({ uid: d.id, name: raw.name, email: raw.email });
        }
      });
      setManagers(arr);
    } catch (err) {
      console.error(err);
      setManagers([]);
    }
  }, []);

  const fetchStaffForAllCabangs = useCallback(async (cabangsList: any[]) => {
    const result: Record<string, any[]> = {};
    for (const cabang of cabangsList) {
      try {
        const snap = await getDocs(
          query(collection(db, "users"), where("cabang", "==", cabang.name))
        );
        const staffList: any[] = [];
        snap.forEach((d) => staffList.push({ uid: d.id, ...d.data() }));
        result[cabang.id] = staffList;
      } catch (err) {
        console.error("Error fetch staff:", err);
        result[cabang.id] = [];
      }
    }
    setStaffMap(result);
  }, []);

  useEffect(() => {
    (async () => {
      await fetchCabangs();
      await fetchManagers();
    })();
  }, [fetchCabangs, fetchManagers]);

  useEffect(() => {
    if (cabangs.length > 0) {
      fetchStaffForAllCabangs(cabangs);
    }
  }, [cabangs, fetchStaffForAllCabangs]);

  const handleAddCabang = async () => {
    const name = newCabang.trim();
    if (!name) return toast.error("Nama cabang tidak boleh kosong");
    if (cabangs.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      return toast.error("Cabang sudah ada");
    }

    setSaving(true);
    try {
      await addDoc(collection(db, "cabangs"), {
        name,
        managerId: "",
        managerName: "",
        managerEmail: "",
        createdAt: new Date(),
      });

      await createLog({
        uid: user?.uid ?? "",
        role: role ?? "unknown",
        action: "create_cabang",
        target: name,
      });

      setNewCabang("");
      await fetchCabangs();
      toast.success("Cabang ditambahkan");
    } catch (err) {
      console.error(err);
      toast.error("Gagal menambah cabang");
    }
    setSaving(false);
  };

  const handleSetManager = async (cabang: any, manager: any) => {
    if (!manager) return;
    setSaving(true);

    try {
      await updateDoc(doc(db, "cabangs", cabang.id), {
        managerId: manager.uid,
        managerName: manager.name,
        managerEmail: manager.email,
      });

      await updateDoc(doc(db, "users", manager.uid), {
        role: "manager",
        cabang: cabang.name,
      });

      await createLog({
        uid: user?.uid ?? "",
        role: role ?? "unknown",
        action: "assign_manager",
        detail: `Set manager ${manager.email} for ${cabang.name}`,
      });

      await fetchCabangs();
      toast.success("Manager diperbarui");
    } catch (err) {
      console.error(err);
      toast.error("Gagal set manager");
    }

    setSaving(false);
  };

  const handleDeleteCabang = async (name: string) => {
    if (!confirm(`Hapus cabang ${name}? Semua user akan di-unassign.`)) return;
    setDeletingId(name);

    try {
      const snap = await getDocs(query(collection(db, "cabangs"), where("name", "==", name)));
      for (const d of snap.docs) {
        const cId = d.id;

        const usersSnap = await getDocs(query(collection(db, "users"), where("cabang", "==", name)));
        for (const u of usersSnap.docs) {
          await updateDoc(doc(db, "users", u.id), {
            cabang: "",
            role: "staff",
          });
        }

        await deleteDoc(doc(db, "cabangs", cId));
      }

      toast.success("Cabang dihapus");
      await fetchCabangs();
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus");
    }

    setDeletingId(null);
  };

  const filtered = cabangs.filter((c) =>
    (c.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER]}>
      <div className="min-h-screen bg-gray-100 pt-16">
        <NavbarSwitcher />

        <div className="max-w-5xl mx-auto px-6 py-10">
          <h1 className="text-4xl font-extrabold mb-4 text-gray-900">
            🏢 Manajemen Cabang
          </h1>

          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3 text-gray-400" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari cabang..."
                className="w-full border rounded-xl px-12 py-3 bg-white text-gray-800"
              />
            </div>

            <input
              value={newCabang}
              onChange={(e) => setNewCabang(e.target.value)}
              placeholder="Nama cabang baru"
              className="border px-4 py-3 rounded-xl bg-white text-gray-800"
            />

            <button
              onClick={handleAddCabang}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl flex items-center gap-1 disabled:opacity-50"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {loadingCabangs ? (
              <div className="text-center py-10 text-gray-500">Memuat...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-gray-500">Tidak ada cabang</div>
            ) : (
              filtered.map((cabang) => (
                <div
                  key={cabang.id}
                  className="bg-white p-6 rounded-xl shadow border hover:border-blue-400 transition cursor-pointer"
                >
                  <Link href={`/admin/cabang/${cabang.id}`}>
                    <div className="text-2xl font-bold text-gray-900">
                      {cabang.name}
                    </div>
                  </Link>

                  <div className="mt-2 text-blue-600 font-semibold">
                    Manager: {cabang.managerName || "-"}{" "}
                    {cabang.managerEmail ? `(${cabang.managerEmail})` : ""}
                  </div>

                  <div className="mt-2 text-gray-700">
                    <Users className="inline-block mr-2" size={18} />
                    Staff ({staffMap[cabang.id]?.length ?? 0}):
                  </div>

                  <ul className="text-sm text-gray-600 mt-1 ml-6 list-disc">
                    {staffMap[cabang.id]?.length > 0 ? (
                      staffMap[cabang.id].map((s) => (
                        <li key={s.uid}>
                          {s.name} ({s.email}) — role: {s.role}
                        </li>
                      ))
                    ) : (
                      <li>-</li>
                    )}
                  </ul>

                  <div className="flex justify-between items-center mt-4">
                    <select
                      defaultValue={cabang.managerId || ""}
                      onChange={(e) => {
                        const m = managers.find((mm) => mm.uid === e.target.value);
                        if (m) handleSetManager(cabang, m);
                      }}
                      className="border px-4 py-2 rounded-xl bg-white text-gray-800"
                    >
                      <option value="">Pilih Manager Baru</option>
                      {managers.map((m) => (
                        <option key={m.uid} value={m.uid}>
                          {m.name} - {m.email}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleDeleteCabang(cabang.name)}
                      className="text-red-600 hover:text-red-800 font-semibold"
                    >
                      Hapus Cabang
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import NavbarStaff from "./NavbarStaff";
import NavbarManagement from "./NavbarManagement";
import NavbarOwner from "./NavbarOwner";
import NavbarAdmin from "./NavbarAdmin";
import NavbarPublic from "./NavbarPublic"; // fallback kalau belum login

export default function NavbarSwitcher() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const ref = doc(db, "users", u.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const userData = snap.data();
            setRole(userData.role || "staff");
          } else {
            setRole("staff");
          }
        } catch (err) {
          console.error("Gagal ambil role:", err);
          setRole("staff");
        }
      } else {
        setRole("public");
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) return null; // Hindari flicker

  // 🔹 Render sesuai role user
  switch (role) {
    case "admin":
      return <NavbarAdmin />;
    case "owner":
      return <NavbarOwner />;
    case "manager":
      return <NavbarManagement />;
    case "staff":
      return <NavbarStaff />;
    default:
      return <NavbarPublic />;
  }
}

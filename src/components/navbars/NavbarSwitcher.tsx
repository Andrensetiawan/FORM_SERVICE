"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import NavbarStaff from "./NavbarStaff";
import NavbarManager from "./NavbarManager";
import NavbarOwner from "./NavbarOwner";
import NavbarAdmin from "./NavbarAdmin";
import NavbarPublic from "./NavbarPublic";

export default function NavbarSwitcher() {
  const [role, setRole] = useState<string>("public");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // 👉 Customer / Public
        setRole("public");
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
          console.warn("User doc tidak ditemukan, fallback staff/public.");
          setRole("public");
          setLoading(false);
          return;
        }

        const data = snap.data();
        const r = (data.role || "public").toLowerCase();

        // Valid roles
        const validRoles = ["admin", "owner", "manager", "staff", "customer"];

        // Jika role tidak valid → fallback public
        setRole(validRoles.includes(r) ? r : "public");
      } catch (err) {
        console.error("Error ambil role navbar:", err);
        setRole("public");
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) return null; // hindari flicker

  // ================================
  // 🔥 Render navbar sesuai ROLE
  // ================================
  switch (role) {
    case "admin":
      return <NavbarAdmin />;

    case "owner":
      return <NavbarOwner />;

    case "manager":
      return <NavbarManager />;

    case "staff":
      return <NavbarStaff />;

    case "customer":
      return <NavbarPublic />; // customer = no login

    default:
      return <NavbarPublic />;
  }
}

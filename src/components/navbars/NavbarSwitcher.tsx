"use client";

import useAuth from "@/hooks/useAuth";

import NavbarStaff from "./NavbarStaff";
import NavbarManager from "./NavbarManager";
import NavbarOwner from "./NavbarOwner";
import NavbarAdmin from "./NavbarAdmin";
import NavbarPublic from "./NavbarPublic";

export default function NavbarSwitcher({ className }: { className?: string }) {
  const { role, loading } = useAuth();

  if (loading) return null; // hindari flicker

  // ================================
  // 🔥 Render navbar sesuai ROLE
  // ================================
  switch (role) {
    case "admin":
      return <NavbarAdmin className={className} />;

    case "owner":
      return <NavbarOwner className={className} />;

    case "manager":
      return <NavbarManager className={className} />;

    case "staff":
      return <NavbarStaff className={className} />;

    case "customer":
      return <NavbarPublic className={className} />; // customer = no login

    default:
      return <NavbarPublic className={className} />;
  }
}

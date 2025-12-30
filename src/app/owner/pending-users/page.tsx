"use client";

import NavbarSwitcher from "@/components/navbars/NavbarSwitcher";
import ProtectedRoute from "@/components/ProtectedRoute";
import PendingUsers from "@/components/pending-users";
import { ROLES } from "@/lib/roles";

export default function OwnerPendingUsersPage() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER]}>
      <div className="min-h-screen bg-gray-100">
        <NavbarSwitcher />
        <PendingUsers />
      </div>
    </ProtectedRoute>
  );
}
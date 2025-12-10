"use client";

import NavbarSwitcher from "@/components/navbars/NavbarSwitcher";
import ProtectedRoute from "@/components/ProtectedRoute";
import PendingUsers from "@/components/pending-users";
import { ROLES } from "@/lib/roles";

export default function AdminPendingUsersPage() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER]}>
      <div>
        <NavbarSwitcher />
        <PendingUsers />
      </div>
    </ProtectedRoute>
  );
}
'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import NavbarSwitcher from '@/components/navbars/NavbarSwitcher';
import OwnerDashboard from '@/components/owner/OwnerDashboard';
import { ROLES } from '@/lib/roles';

export default function OwnerPage() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.OWNER, ROLES.MANAGER]}>
      <div className="min-h-screen bg-gray-50">
        <NavbarSwitcher />
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <OwnerDashboard />
        </main>
      </div>
    </ProtectedRoute>
  );
}

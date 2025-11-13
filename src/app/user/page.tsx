'use client'

import ProtectedRoute from '../components/ProtectedRoute';

export default function UserPage() {
  return (
    <ProtectedRoute allowedRoles={["user","staff","manager","owner","admin"]}>
      <div className="p-6">
        <h1 className="text-2xl font-bold">User Area</h1>
        <p className="mt-2">This page is for authenticated users. If you see this, you have access.</p>
      </div>
    </ProtectedRoute>
  );
}

"use client";

import Chat from '@/components/Chat'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function SnapPage() {
  return (
    <ProtectedRoute>
      <div className="container py-8">
        <Chat />
      </div>
    </ProtectedRoute>
  )
} 
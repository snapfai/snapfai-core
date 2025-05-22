import ProtectedRoute from "@/components/ProtectedRoute"

export default function SnapLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  )
} 
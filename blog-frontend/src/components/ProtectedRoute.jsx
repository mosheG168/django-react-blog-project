import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Usage:
 *   <ProtectedRoute>...</ProtectedRoute>             → requires login
 *   <ProtectedRoute adminOnly>...</ProtectedRoute>   → requires admin
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />; // or show 403 page if you prefer
  }

  return children;
}

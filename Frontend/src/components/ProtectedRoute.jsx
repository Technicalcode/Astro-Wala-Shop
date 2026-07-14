import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "../store/authSlice";

/**
 * <ProtectedRoute role="admin">...</ProtectedRoute>   -> admin-only route
 * <ProtectedRoute>...</ProtectedRoute>                -> any logged-in user (User or Admin)
 *
 * - Not logged in            -> redirect to the right login page, remembering
 *                                where the visitor was headed (`state.from`)
 *                                so Login.jsx can send them back afterwards.
 * - Logged in, wrong role    -> redirect to Home (unchanged behaviour).
 * - Logged in, role matches  -> render the protected page.
 */
export default function ProtectedRoute({ children, role }) {
  const user = useSelector(selectUser);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (role && user.role !== role) return <Navigate to="/" replace />;

  return children;
}

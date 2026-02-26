import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export const ProtectedRoute = () => {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <Outlet />;
};

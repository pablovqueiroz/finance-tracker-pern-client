import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import LoadingStatus from "../LoadingStatus/LoadingStatus";

export const ProtectedRoute = () => {
  const { isLoggedIn, isLoading } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  if (isLoading) {
    return <LoadingStatus label={t("common.checkingSession")} page />;
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
};

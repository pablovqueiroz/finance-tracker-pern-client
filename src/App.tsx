import { lazy, Suspense, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MobileMenu from "./components/MobileMenu/MobileMenu";
import NavBar from "./components/NavBar/NavBar";
import { ProtectedRoute } from "./components/ProtectedRoute/ProtectedRoute";
import LoadingStatus from "./components/LoadingStatus/LoadingStatus";

const LoginPage = lazy(() => import("./pages/Auth/Login/LoginPage"));
const RegisterPage = lazy(() => import("./pages/Auth/Register/RegisterPage"));
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const HomePage = lazy(() => import("./pages/HomePage/HomePage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage/NotFoundPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage/ProfilePage"));
const CreateAccountPage = lazy(
  () => import("./pages/Accounts/CreateAccountPage/CreateAccountPage"),
);
const ManageAccountsPage = lazy(
  () => import("./pages/Accounts/ManageAccountsPage/ManageAccountsPage"),
);
const AccountDetailsPage = lazy(
  () => import("./pages/Accounts/AccountDetailsPage/AccountDetailsPage"),
);
const CreateTransactionPage = lazy(
  () => import("./pages/Transactions/CreateTransactionPage"),
);
const ManageSavingGoalsPage = lazy(
  () => import("./pages/SavingGoals/ManageSavingGoalsPage"),
);
const ReportsPage = lazy(() => import("./pages/ReportsPage/ReportsPage"));
const AccountMembersPage = lazy(
  () => import("./pages/AccountMembersPage/AccountMembersPage"),
);
const ContactPage = lazy(() => import("./pages/ContacPage/ContactPage"));
const InvitesPage = lazy(() => import("./pages/InvitesPage/InvitesPage"));

function App() {
  const { t } = useTranslation();
  const [activeAccountId, setActiveAccountId] = useState("");
  return (
    <>
      <header>
        <NavBar />
      </header>
      <main>
        <Suspense
          fallback={
            <LoadingStatus label={t("common.loading")} page />
          }
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<NotFoundPage />} />
            {/* protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route
                path="/dashboard"
                element={
                  <Dashboard onActiveAccountChange={setActiveAccountId} />
                }
              />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/create-account" element={<CreateAccountPage />} />
              <Route path="/accounts" element={<ManageAccountsPage />} />
              <Route
                path="/accounts/:accountId"
                element={<AccountDetailsPage />}
              />
              <Route
                path="/accounts/:accountId/members"
                element={<AccountMembersPage />}
              />
              <Route path="/invites" element={<InvitesPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route
                path="/accounts/:accountId/transactions"
                element={<CreateTransactionPage />}
              />
              <Route path="/savings" element={<ManageSavingGoalsPage />} />
              <Route
                path="/accounts/:accountId/savings"
                element={<ManageSavingGoalsPage />}
              />
              <Route
                path="/accounts/:accountId/saving-goals"
                element={<ManageSavingGoalsPage />}
              />
            </Route>
            {/* ^protected routes^ */}
          </Routes>
        </Suspense>
      </main>
      <footer>
        <MobileMenu activeAccountId={activeAccountId} />
      </footer>
    </>
  );
}

export default App;

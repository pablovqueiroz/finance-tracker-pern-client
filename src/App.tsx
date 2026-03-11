import { Route, Routes } from "react-router-dom";
import MobileMenu from "./components/MobileMenu/MobileMenu";
import NavBar from "./components/NavBar/NavBar";
import LoginPage from "./pages/Auth/Login/LoginPage";
import RegisterPage from "./pages/Auth/Register/RegisterPage";
import Dashboard from "./pages/Dashboard/Dashboard";
import HomePage from "./pages/HomePage/HomePage";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import CreateAccountPage from "./pages/Accounts/CreateAccountPage/CreateAccountPage";
// import { ProtectedRoute } from "./components/ProtectedRoute/ProtectedRoute";
import ManageAccountsPage from "./pages/Accounts/ManageAccountsPage/ManageAccountsPage";
import AccountDetailsPage from "./pages/Accounts/AccountDetailsPage/AccountDetailsPage";
import CreateTransactionPage from "./pages/Transactions/CreateTransactionPage";
import ManageSavingGoalsPage from "./pages/SavingGoals/ManageSavingGoalsPage";
import ReportsPage from "./pages/ReportsPage";
import AccountMembersPage from "./pages/AccountMembersPage";
import InvitesPage from "./pages/InvitesPage";
import ContactPage from "./pages/ContactPage";

function App() {
  return (
    <>
      <header>
        <NavBar />
      </header>
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<NotFoundPage />} />

          {/* protected routes */}
          {/* <Route element={<ProtectedRoute />}> */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/create-account" element={<CreateAccountPage />} />
          <Route path="/accounts" element={<ManageAccountsPage />} />
          <Route path="/accounts/:accountId" element={<AccountDetailsPage />} />
          <Route path="/accounts/:accountId/members" element={<AccountMembersPage />} />
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
          {/* </Route> protected routes*/}
        </Routes>
      </main>
      <footer>
        <MobileMenu />
      </footer>
    </>
  );
}

export default App;

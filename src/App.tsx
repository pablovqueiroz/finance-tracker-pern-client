import { Route, Routes } from "react-router-dom";
import MobileMenu from "./components/MobileMenu/MobileMenu";
import LoginPage from "./pages/Auth/Login/LoginPage";
import RegisterPage from "./pages/Auth/Register/RegisterPage";
import Dashboard from "./pages/Dashboard/Dashboard";
import HomePage from "./pages/HomePage/HomePage";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
// import { useAuth } from "./hooks/useAuth";
import CreateAccountPage from "./pages/Accounts/CreateAccountPage/CreateAccountPage";
// import { ProtectedRoute } from "./components/ProtectedRoute/ProtectedRoute";
import ManageAccountsPage from "./pages/Accounts/ManageAccountsPage/ManageAccountsPage";
import AccountDetailsPage from "./pages/Accounts/AccountDetailsPage/AccountDetailsPage";

function App() {
  // const { isLoggedIn } = useAuth();

  return (
    <>
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
          {/* </Route> */}
        </Routes>
      </main>
      <footer>
        {/* { isLoggedIn &&  */}
        <MobileMenu />
        {/* } */}
      </footer>
    </>
  );
}

export default App;

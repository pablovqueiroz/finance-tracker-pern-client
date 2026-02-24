import { Route, Routes } from "react-router"
import MobileMenu from "./components/MobileMenu/MobileMenu"
import LoginPage from "./pages/Auth/Login/LoginPage"
import RegisterPage from "./pages/Auth/Register/RegisterPage"
import Dashboard from "./pages/Dashboard/Dashboard"
import HomePage from "./pages/HomePage/HomePage"
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage"
import ProfilePage from "./pages/ProfilePage/ProfilePage"
import { useAuth } from "./hooks/useAuth"

function App() {
  const { isLoggedIn } = useAuth();

  return (
    <>
      <main>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/" element={<HomePage/>}/>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage/>}/>
          <Route path="/profile" element={<ProfilePage/>}/>
          <Route path="*" element={<NotFoundPage/>}/>
        </Routes>
      </main>
      <footer>
        {isLoggedIn &&
        <MobileMenu />}

      </footer>
    </>
  )
}

export default App

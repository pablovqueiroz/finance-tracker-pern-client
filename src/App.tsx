import { Route, Routes } from "react-router"
import MobileMenu from "./components/MobileMenu/MobileMenu"
import HomePage from "./pages/HomePage/HomePage"

function App() {

  return (
    <>
      <main>
        <Routes>
          <Route path="/home" element={<HomePage />} />
        </Routes>
      </main>
      <footer>
        <MobileMenu />

      </footer>
    </>
  )
}

export default App

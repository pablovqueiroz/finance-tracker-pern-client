import "./styles/reset.css";
import "./styles/variables.css";
import "./styles/global.css";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx';
import { BrowserRouter } from 'react-router-dom';
import { AuthWrapper } from "./context/AuthContext.tsx";


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AuthWrapper>
          <App />
        </AuthWrapper>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);

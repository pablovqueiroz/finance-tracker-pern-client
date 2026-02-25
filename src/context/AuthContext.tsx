import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  type AuthContextType,
  type AuthWrapperProps,
  type User,
} from "../types/auth.types";
import api from "../services/api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const nav = useNavigate();

  const isLoggedIn = currentUser !== null;
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("authToken"),
  );

  async function authenticateUser(): Promise<void> {
    const tokenInStorage = localStorage.getItem("authToken");
    setToken(tokenInStorage);

    if (!tokenInStorage) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await api.get<User>("/users/me");
      setCurrentUser(data);
    } catch (error) {
      console.error(error);
      localStorage.removeItem("authToken");
      setToken(null);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  const handleLogout = (): void => {
    localStorage.removeItem("authToken");
    setToken(null);
    setCurrentUser(null);
    nav("/login");
  };

  useEffect(() => {
    void authenticateUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isLoggedIn,
        token,
        authenticateUser,
        handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthWrapper };

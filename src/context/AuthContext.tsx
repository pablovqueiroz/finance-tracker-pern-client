import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  type AuthContextType,
  type AuthWrapperProps,
  type User,
} from "../types/auth.types";
import api from "../services/api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_TOKEN_KEY = "authToken";
const AUTH_USER_KEY = "authUser";

const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem(AUTH_USER_KEY);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as User;
    } catch {
      localStorage.removeItem(AUTH_USER_KEY);
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const nav = useNavigate();

  const isLoggedIn = currentUser !== null;
  const [token, setToken] = useState<string | null>(
    localStorage.getItem(AUTH_TOKEN_KEY),
  );

  const clearAuthState = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setToken(null);
    setCurrentUser(null);
  };

  const persistUser = (user: User | null) => {
    setCurrentUser(user);

    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      return;
    }

    localStorage.removeItem(AUTH_USER_KEY);
  };

  async function authenticateUser(user?: User | null): Promise<void> {
    const tokenInStorage = localStorage.getItem(AUTH_TOKEN_KEY);
    setToken(tokenInStorage);

    if (!tokenInStorage) {
      persistUser(null);
      setIsLoading(false);
      return;
    }

    if (user) {
      persistUser(user);
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await api.get<User>(`users/me`);
      persistUser(data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        clearAuthState();
      } else if (!currentUser) {
        persistUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handleLogout = (): void => {
    clearAuthState();
    nav("/");
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

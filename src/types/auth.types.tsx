import type { ReactNode } from "react";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  token: string | null;
  authenticateUser: () => Promise<void>;
  handleLogout: () => void;
}

export interface AuthWrapperProps {
  children: ReactNode;
}

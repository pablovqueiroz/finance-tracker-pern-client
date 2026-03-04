import type { ReactNode } from "react";

export type Gender =
  | "MALE"
  | "FEMALE"
  | "NON_BINARY"
  | "TRANS_MAN"
  | "TRANS_WOMAN"
  | "AGENDER"
  | "GENDERFLUID"
  | "PREFER_NOT_TO_SAY"
  | "OTHER";

export type AuthProvider = "LOCAL" | "GOOGLE";

export interface User {
  id: string;
  email: string;
  name: string;
  gender?: Gender | null;
  image?: string;
  provider?: AuthProvider;
  createdAt?: string | Date;
  updatedAt?: string | Date;
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

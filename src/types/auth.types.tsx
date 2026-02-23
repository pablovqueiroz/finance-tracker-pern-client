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
    authenticateUser: () => Promise<User | undefined>;
    handleLogout: () => void;
}

export interface AuthWrapperProps {
    children: ReactNode
}
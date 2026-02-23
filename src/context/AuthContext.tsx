import {createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { type AuthContextType, type AuthWrapperProps, type User } from "../types/auth.types";
import axios from "axios";
import { API_URL } from "../config/config";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthWrapper = ({ children }: AuthWrapperProps) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const nav = useNavigate();

    async function authenticateUser(): Promise<User | undefined> {
        const tokenInStorage = localStorage.getItem("authToken");

        if (!tokenInStorage) {
            setCurrentUser(null);
            setIsLoggedIn(false)
            setIsLoading(false)
            return;
        }

        try {
            const { data } = await axios.get(`${API_URL}/api/auth/verify`, {
                headers: {
                    Authorization: `Bearer ${tokenInStorage}`,
                },
            });

            const user = data.decodedToken as User;
            setCurrentUser(data.decodedToken);
            setIsLoggedIn(true);

            return user;

        } catch (error) {
            console.log(error);
            setCurrentUser(null);
            setIsLoggedIn(false);
        } finally {
            setIsLoading(false);
        }
    }
    const handleLogout = (): void => {
        localStorage.removeItem("authToken");
        setCurrentUser(null);
        setIsLoggedIn(false)
        nav("login")
    }
    useEffect(() => {
        authenticateUser();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                currentUser, isLoading, isLoggedIn, authenticateUser, handleLogout
            }}>
            {children}
        </AuthContext.Provider>
    )
}

export { AuthContext, AuthWrapper };
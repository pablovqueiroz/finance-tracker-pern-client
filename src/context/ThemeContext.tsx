import { createContext, useEffect, useState } from "react";
import type { Theme, ThemeContextType, ThemeProviderProps } from "../types/themes.types";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(() => {
        const savedTheme = localStorage.getItem("theme") as Theme;
        return savedTheme || "light"
    });

    useEffect(() => {
        document.body.classList.toggle("dark", theme === "dark")

    }, [theme])

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);

        document.body.classList.toggle("dark", newTheme === "dark");
        localStorage.setItem("theme", newTheme);
    }
    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
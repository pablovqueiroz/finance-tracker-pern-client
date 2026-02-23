import type { ReactNode } from "react";

export type Theme = "light" | "dark";

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export interface ThemeProviderProps {
  children: ReactNode;
}
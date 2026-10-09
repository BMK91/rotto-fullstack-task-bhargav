"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

interface AppThemeProviderProps {
  children: React.ReactNode;
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="rotto-recruiter-theme"
    >
      {children}
    </NextThemesProvider>
  );
}

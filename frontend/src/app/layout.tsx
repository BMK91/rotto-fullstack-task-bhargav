import type { Metadata } from "next";

import "./globals.css";

import { AppThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Rotto Recruiter",
  description: "Find the right candidates with natural-language search.",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AppThemeProvider>{children}</AppThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}

"use client";

import { ChevronDown, LogOut, Menu, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ThemeSelector } from "@/components/layout/theme-selector";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/lib/toast";

interface AppHeaderProps {
  email: string;
  companyName: string;
}

export function AppHeader({ email, companyName }: AppHeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout(): Promise<void> {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Logout failed with status ${response.status}`);
      }

      toast.success("Logged out successfully.");

      router.replace("/login");
      router.refresh();
    } catch (error: unknown) {
      console.error("Logout failed:", error);
      toast.error("Unable to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open navigation"
            onClick={() => toast.info("Navigation menu coming soon.")}
          >
            <Menu className="size-5" />
          </Button>

          <span className="truncate text-lg font-bold tracking-tight">
            Rotto Recruiter
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Open account menu"
            className="inline-flex h-auto items-center gap-2 rounded-md px-2 py-2 hover:bg-accent hover:text-accent-foreground"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
              <UserRound className="size-5" />
            </span>

            <span className="hidden min-w-0 text-left sm:block">
              <span className="block max-w-52 truncate text-sm font-medium">
                {email || "Recruiter"}
              </span>
              <span className="block max-w-52 truncate text-xs text-muted-foreground">
                {companyName ? `(${companyName})` : "Company"}
              </span>
            </span>

            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Theme</DropdownMenuLabel>

              <div className="px-2 py-2">
                <ThemeSelector />
              </div>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                disabled={isLoggingOut}
                onClick={() => {
                  void handleLogout();
                }}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 size-4" />
                {isLoggingOut ? "Logging out..." : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

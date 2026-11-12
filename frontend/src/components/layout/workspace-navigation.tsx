"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, LayoutDashboard, Search, Users } from "lucide-react";

export type WorkspaceSection = "dashboard" | "candidate-search" | "shortlists" | "saved-searches";

interface WorkspaceNavigationProps {
  active?: WorkspaceSection;
}

const navigationItems: Array<{
  id: WorkspaceSection;
  href: string;
  label: string;
  Icon: typeof Search;
}> = [
  { id: "dashboard", href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "candidate-search", href: "/candidate-search", label: "Candidate Search", Icon: Search },
  { id: "shortlists", href: "/shortlists", label: "Shortlists", Icon: Users },
  { id: "saved-searches", href: "/saved-searches", label: "Saved Searches", Icon: Bookmark },
];

export function WorkspaceNavigation({ active }: WorkspaceNavigationProps) {
  const pathname = usePathname();
  const activeSection =
    active ??
    navigationItems.find(
      ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
    )?.id;

  return (
    <nav aria-label="Recruiter workspace" className="border-b">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mb-px flex items-center gap-1 overflow-x-auto">
          {navigationItems.map(({ id, href, label, Icon }) => {
            const isActive = activeSection === id;
            return (
              <Link
                key={id}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

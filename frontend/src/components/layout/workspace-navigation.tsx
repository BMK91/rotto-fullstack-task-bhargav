import Link from "next/link";
import { Bookmark, LayoutDashboard, Search } from "lucide-react";

type WorkspaceSection = "dashboard" | "candidate-search" | "saved-searches";

interface WorkspaceNavigationProps {
  active: WorkspaceSection;
}

const navigationItems: Array<{
  id: WorkspaceSection;
  href: string;
  label: string;
  Icon: typeof Search;
}> = [
  { id: "dashboard", href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "candidate-search", href: "/candidate-search", label: "Candidate Search", Icon: Search },
  { id: "saved-searches", href: "/saved-searches", label: "Saved Searches", Icon: Bookmark },
];

export function WorkspaceNavigation({ active }: WorkspaceNavigationProps) {
  return (
    <nav aria-label="Recruiter workspace" className="-mx-1 overflow-x-auto px-1">
      <div className="flex min-w-max items-center gap-1 border-b">
        {navigationItems.map(({ id, href, label, Icon }) => {
          const isActive = active === id;
          return (
            <Link
              key={id}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
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
    </nav>
  );
}

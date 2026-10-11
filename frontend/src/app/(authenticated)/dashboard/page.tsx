import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Bookmark, Search } from "lucide-react";

import { WorkspaceNavigation } from "@/components/layout/workspace-navigation";

export const metadata: Metadata = {
  title: "Dashboard | Rotto Recruiter",
  description: "Manage candidate searches and shortlists.",
};

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <WorkspaceNavigation active="dashboard" />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find and manage candidates for your company.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/candidate-search"
          className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-start justify-between gap-3">
            <Search className="mt-0.5 size-5 text-primary" aria-hidden="true" />
            <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-medium">Candidate Search</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Search candidates using natural language.
          </p>
        </Link>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-medium">Shortlists</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Review your shortlisted candidates.
          </p>
        </div>

        <Link
          href="/saved-searches"
          className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-start justify-between gap-3">
            <Bookmark className="mt-0.5 size-5 text-primary" aria-hidden="true" />
            <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-medium">Saved Searches</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Return to your saved candidate searches.
          </p>
        </Link>
      </div>
    </section>
  );
}

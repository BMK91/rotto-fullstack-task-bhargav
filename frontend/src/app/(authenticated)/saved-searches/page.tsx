import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, CircleHelp } from "lucide-react";

import { WorkspaceNavigation } from "@/components/layout/workspace-navigation";

export const metadata: Metadata = {
  title: "Saved Searches | Rotto Recruiter",
  description: "View saved candidate searches.",
};

export default function SavedSearchesPage() {
  return (
    <section className="space-y-6">
      <WorkspaceNavigation active="saved-searches" />
      <header className="space-y-1">
        <p className="text-sm font-medium text-primary">Your workspace</p>
        <h1 className="text-2xl font-semibold tracking-tight">Saved Searches</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Return to candidate searches you have saved for later.
        </p>
      </header>

      <div className="rounded-2xl border border-dashed bg-card px-5 py-10 text-center sm:py-14">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Bookmark className="size-5" aria-hidden="true" />
        </div>
        <h2 className="mt-4 font-semibold">Saved searches aren’t available yet</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          The backend currently supports running and paging through a search, but it does not expose an API to save, list, or reopen saved searches. This page will show your saved searches once that API is available.
        </p>
        <div className="mt-5 inline-flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-left text-xs leading-5 text-muted-foreground">
          <CircleHelp className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>Search results are not presented as saved searches; historical search runs and recruiter-saved briefs are separate features.</span>
        </div>
        <div className="mt-6">
          <Link
            href="/candidate-search"
            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Start a candidate search
          </Link>
        </div>
      </div>
    </section>
  );
}

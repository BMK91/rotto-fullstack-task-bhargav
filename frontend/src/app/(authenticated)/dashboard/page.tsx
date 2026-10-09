import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Rotto Recruiter",
  description: "Manage candidate searches and shortlists.",
};

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find and manage candidates for your company.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-medium">Candidate Search</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Search candidates using natural language.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-medium">Shortlists</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Review your shortlisted candidates.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-medium">Saved Searches</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Return to your saved candidate searches.
          </p>
        </div>
      </div>
    </section>
  );
}
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { WorkspaceNavigation } from "@/components/layout/workspace-navigation";

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default function AuthenticatedLayout({
  children,
}: Readonly<AuthenticatedLayoutProps>) {
  return (
    <Suspense fallback={<AuthenticatedLayoutFallback />}>
      <AuthenticatedContent>{children}</AuthenticatedContent>
    </Suspense>
  );
}

async function AuthenticatedContent({
  children,
}: Readonly<AuthenticatedLayoutProps>) {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get("rotto_access_token");
  const recruiterCookie = cookieStore.get("rotto_recruiter");

  if (!accessToken?.value) {
    redirect("/login");
  }

  let recruiter: { email: string; companyName: string } | null = null;

  try {
    if (recruiterCookie?.value) {
      const parsed: unknown = JSON.parse(recruiterCookie.value);

      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "email" in parsed &&
        typeof parsed.email === "string" &&
        "companyName" in parsed &&
        typeof parsed.companyName === "string"
      ) {
        recruiter = {
          email: parsed.email,
          companyName: parsed.companyName,
        };
      }
    }
  } catch {
    // Ignore invalid display data.
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-x-0 top-0 z-40 bg-background/95 backdrop-blur">
        <AppHeader
          email={recruiter?.email ?? ""}
          companyName={recruiter?.companyName ?? ""}
        />
        <WorkspaceNavigation />
      </div>

      <main className="mx-auto w-full max-w-7xl px-4 pb-6 pt-[calc(4rem+2.75rem+2px+1.5rem)] sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

function AuthenticatedLayoutFallback() {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-x-0 top-0 z-40 bg-background/95 backdrop-blur">
        <header className="h-16 border-b" />
        <div className="h-11 border-b" />
      </div>
      <main className="mx-auto w-full max-w-7xl px-4 pb-6 pt-[calc(4rem+2.75rem+2px+1.5rem)] sm:px-6 lg:px-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </main>
    </div>
  );
}

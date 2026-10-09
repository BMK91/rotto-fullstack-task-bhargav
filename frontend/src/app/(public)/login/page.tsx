import Link from "next/link";
import { ArrowUpRight, Users } from "lucide-react";

import { LoginFormContainer } from "@/features/auth/components/login-form-container";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-32 -top-32 size-80 rounded-full bg-primary/10 blur-3xl sm:size-[28rem]" />
        <div className="absolute -bottom-40 -right-32 size-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <header className="mb-8 text-center">
          <Link
            href="/login"
            aria-label="Rotto Recruiter login"
            className="mb-7 inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Users size={25} aria-hidden="true" />
            </span>

            <span className="text-left">
              <span className="block text-xl font-bold tracking-tight">
                Rotto Recruiter
              </span>
              <span className="block text-xs text-muted-foreground">
                Talent workspace
              </span>
            </span>
          </Link>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            Sign in to find the right talent for your team.
          </p>
        </header>

        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-xl shadow-black/[0.03] sm:p-8">
          <div className="mb-6 space-y-1">
            <h2 className="text-lg font-semibold">Sign in to your account</h2>
            <p className="text-sm text-muted-foreground">
              Enter your work email and password to continue.
            </p>
          </div>

          <LoginFormContainer />
        </section>

        <footer className="mt-6 text-center text-xs leading-5 text-muted-foreground">
          <p>Secure access to your recruitment workspace.</p>
          <p className="mt-2">
            By continuing, you agree to use your company account responsibly.
          </p>
        </footer>

        <div className="mt-6 flex justify-center">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            Built for better hiring
            <ArrowUpRight size={13} aria-hidden="true" />
          </span>
        </div>
      </div>
    </main>
  );
}

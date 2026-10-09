
export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <section className="w-full max-w-xl space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Rotto Recruiter
        </h1>

        <p className="text-muted-foreground">
          Find the right candidates with natural-language search.
        </p>

        <p className="text-sm text-muted-foreground">
          Recruiter workspace
        </p>
      </section>
    </main>
  );
}
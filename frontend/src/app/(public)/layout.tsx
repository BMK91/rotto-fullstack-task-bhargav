import { Suspense, type ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({
  children,
}: Readonly<PublicLayoutProps>) {
  return (
    <Suspense fallback={<PublicLayoutFallback />}>
      <PublicContent>{children}</PublicContent>
    </Suspense>
  );
}

async function PublicContent({ children }: Readonly<PublicLayoutProps>) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("rotto_access_token");

  if (accessToken?.value) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}

function PublicLayoutFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="h-80 w-full max-w-md animate-pulse rounded-xl bg-muted" />
    </main>
  );
}

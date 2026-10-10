import type { ReactNode } from "react";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <PublicLayoutContent>{children}</PublicLayoutContent>
    </Suspense>
  );
}

async function PublicLayoutContent({ children }: Readonly<PublicLayoutProps>) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("rotto_access_token");

  if (accessToken?.value) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      {children}
    </main>
  );
}

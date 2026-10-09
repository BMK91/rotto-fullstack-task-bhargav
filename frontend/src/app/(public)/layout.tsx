import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

interface PublicLayoutProps {
  children: ReactNode;
}

export default async function PublicLayout({
  children,
}: Readonly<PublicLayoutProps>) {
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

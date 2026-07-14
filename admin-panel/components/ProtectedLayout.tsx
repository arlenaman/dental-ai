"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { PageSpinner } from "@/components/ui";

export function ProtectedLayout({
  children,
  title,
  actions,
}: {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
}) {
  const { staff, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !staff) router.replace("/login");
  }, [loading, staff, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <PageSpinner />
      </div>
    );
  }

  if (!staff) return null;

  return (
    <div className="flex min-h-screen flex-col bg-bg md:flex-row">
      <Sidebar />
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
        {(title || actions) && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            {title && <h1 className="text-lg font-semibold text-text">{title}</h1>}
            {actions}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

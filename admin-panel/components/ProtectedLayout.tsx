"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Nav } from "@/components/Nav";

export function ProtectedLayout({ children }: { children: ReactNode }) {
  const { staff, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !staff) router.replace("/login");
  }, [loading, staff, router]);

  if (loading) {
    return <div className="p-6 text-neutral-500">Загрузка…</div>;
  }

  if (!staff) return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}

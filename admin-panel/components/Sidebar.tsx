"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/types";

const LINKS = [
  { href: "/", label: "Обзор", exact: true },
  { href: "/appointments", label: "Записи" },
  { href: "/conversations", label: "Диалоги" },
  { href: "/patients", label: "Пациенты" },
  { href: "/services", label: "Услуги" },
  { href: "/working-hours", label: "Расписание" },
  { href: "/faq", label: "FAQ" },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { staff } = useAuth();
  const isAdmin = staff?.role === "owner" || staff?.role === "admin";

  const links = isAdmin ? [...LINKS, { href: "/staff", label: "Персонал" }] : LINKS;

  return (
    <nav className="flex flex-col gap-0.5">
      {links.map((link) => {
        const active = "exact" in link && link.exact ? pathname === link.href : pathname?.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={
              active
                ? "rounded-md bg-accent-soft px-3 py-2 text-sm font-medium text-accent-strong"
                : "rounded-md px-3 py-2 text-sm text-text-muted hover:bg-surface-2 hover:text-text"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  const { staff, logout } = useAuth();
  if (!staff) return null;

  return (
    <div className="border-t border-border pt-3">
      <p className="truncate text-sm font-medium text-text">{staff.full_name}</p>
      <p className="mb-2 text-xs text-text-muted">{ROLE_LABELS[staff.role] ?? staff.role}</p>
      <button
        onClick={logout}
        className="text-xs text-text-muted hover:text-danger focus:outline-none focus-visible:underline"
      >
        Выйти
      </button>
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col justify-between border-r border-border bg-surface px-4 py-6 md:flex">
        <div>
          <div className="mb-6 px-2">
            <span className="text-base font-semibold text-text">Dental AI</span>
          </div>
          <NavLinks />
        </div>
        <SidebarFooter />
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <span className="text-base font-semibold text-text">Dental AI</span>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-md p-2 text-text hover:bg-surface-2"
          aria-label="Открыть меню"
        >
          ☰
        </button>
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative flex w-64 flex-col justify-between bg-surface px-4 py-6 shadow-[var(--shadow-md)]">
            <div>
              <div className="mb-6 flex items-center justify-between px-2">
                <span className="text-base font-semibold text-text">Dental AI</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md p-1 text-text-muted hover:bg-surface-2"
                  aria-label="Закрыть меню"
                >
                  ✕
                </button>
              </div>
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </div>
            <SidebarFooter />
          </div>
        </div>
      )}
    </>
  );
}

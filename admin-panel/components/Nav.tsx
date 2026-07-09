"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const LINKS = [
  { href: "/conversations", label: "Диалоги" },
  { href: "/services", label: "Услуги" },
  { href: "/working-hours", label: "Расписание" },
  { href: "/faq", label: "FAQ" },
];

export function Nav() {
  const pathname = usePathname();
  const { staff, logout } = useAuth();

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <nav className="flex items-center gap-6">
          <span className="font-semibold text-neutral-900">Dental AI</span>
          {LINKS.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  active
                    ? "text-sm font-medium text-neutral-900"
                    : "text-sm text-neutral-500 hover:text-neutral-900"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 text-sm text-neutral-500">
          {staff && <span>{staff.full_name}</span>}
          <button onClick={logout} className="text-neutral-500 hover:text-neutral-900">
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
}

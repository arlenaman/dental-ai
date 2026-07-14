"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { Card, EmptyState, Input, PageSpinner } from "@/components/ui";
import { api } from "@/lib/api";
import type { Patient } from "@/lib/types";

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<Patient[] | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      api.get<Patient[]>(`/patients${query}`).then(setPatients);
    }, 250);
    return () => clearTimeout(handle);
  }, [search]);

  return (
    <ProtectedLayout title="Пациенты">
      <div className="mb-4">
        <Input
          placeholder="Поиск по имени или телефону…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {patients === null && <PageSpinner />}

      {patients && patients.length === 0 && (
        <EmptyState
          title="Пациенты не найдены"
          description={search ? "Попробуйте другой запрос." : "Пациенты появятся здесь после первой записи."}
        />
      )}

      {patients && patients.length > 0 && (
        <Card className="divide-y divide-border">
          {patients.map((p) => (
            <Link
              key={p.id}
              href={`/patients/${p.id}`}
              className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-surface-2"
            >
              <span className="font-medium text-text">{p.full_name}</span>
              <span className="text-sm text-text-muted">{p.phone}</span>
            </Link>
          ))}
        </Card>
      )}
    </ProtectedLayout>
  );
}

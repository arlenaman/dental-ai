"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { Badge, Card, EmptyState, Input, PageSpinner } from "@/components/ui";
import { api } from "@/lib/api";
import type { Conversation } from "@/lib/types";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get<Conversation[]>("/conversations").then(setConversations);
  }, []);

  const filtered = useMemo(() => {
    if (!conversations) return null;
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) => c.patient_name.toLowerCase().includes(q) || c.patient_phone.includes(q),
    );
  }, [conversations, search]);

  return (
    <ProtectedLayout title="Диалоги с пациентами">
      <div className="mb-4">
        <Input
          placeholder="Поиск по имени или телефону…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {conversations === null && <PageSpinner />}

      {filtered && filtered.length === 0 && (
        <EmptyState
          title={search ? "Ничего не найдено" : "Пока нет ни одного диалога"}
        />
      )}

      {filtered && filtered.length > 0 && (
        <Card className="divide-y divide-border">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/conversations/${c.id}`}
              className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-surface-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text">{c.patient_name}</span>
                  <span className="text-xs text-text-muted">{c.patient_phone}</span>
                  {c.status === "closed" && <Badge variant="neutral">Закрыт</Badge>}
                </div>
                <p className="truncate text-sm text-text-muted">
                  {c.last_message_preview ?? "Нет сообщений"}
                </p>
              </div>
              <span className="shrink-0 text-xs text-text-muted">
                {formatDate(c.last_message_at)}
              </span>
            </Link>
          ))}
        </Card>
      )}
    </ProtectedLayout>
  );
}

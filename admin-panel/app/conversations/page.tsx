"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedLayout } from "@/components/ProtectedLayout";
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

  useEffect(() => {
    api.get<Conversation[]>("/conversations").then(setConversations);
  }, []);

  return (
    <ProtectedLayout>
      <h1 className="mb-6 text-lg font-semibold text-neutral-900">Диалоги с пациентами</h1>

      {conversations === null && <p className="text-sm text-neutral-500">Загрузка…</p>}
      {conversations?.length === 0 && (
        <p className="text-sm text-neutral-500">Пока нет ни одного диалога.</p>
      )}

      <div className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
        {conversations?.map((c) => (
          <Link
            key={c.id}
            href={`/conversations/${c.id}`}
            className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-neutral-50"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-900">{c.patient_name}</span>
                <span className="text-xs text-neutral-400">{c.patient_phone}</span>
              </div>
              <p className="truncate text-sm text-neutral-500">
                {c.last_message_preview ?? "Нет сообщений"}
              </p>
            </div>
            <span className="shrink-0 text-xs text-neutral-400">
              {formatDate(c.last_message_at)}
            </span>
          </Link>
        ))}
      </div>
    </ProtectedLayout>
  );
}

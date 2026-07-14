"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { EmptyState, PageSpinner } from "@/components/ui";
import { api } from "@/lib/api";
import type { Message } from "@/lib/types";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ConversationDetailPage() {
  const params = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[] | null>(null);

  useEffect(() => {
    api.get<Message[]>(`/conversations/${params.id}/messages`).then(setMessages);
  }, [params.id]);

  return (
    <ProtectedLayout title="Переписка">
      <Link
        href="/conversations"
        className="mb-4 inline-block text-sm text-text-muted hover:text-text"
      >
        ← Все диалоги
      </Link>

      {messages === null && <PageSpinner />}
      {messages && messages.length === 0 && <EmptyState title="Сообщений пока нет" />}

      <div className="flex flex-col gap-3">
        {messages?.map((m) => (
          <div
            key={m.id}
            className={
              m.direction === "inbound"
                ? "mr-auto max-w-lg rounded-lg rounded-bl-none border border-border bg-surface px-4 py-2"
                : "ml-auto max-w-lg rounded-lg rounded-br-none bg-accent px-4 py-2 text-accent-fg"
            }
          >
            <p className="whitespace-pre-wrap text-sm">{m.body}</p>
            <p
              className={
                m.direction === "inbound"
                  ? "mt-1 text-xs text-text-muted"
                  : "mt-1 text-xs text-accent-fg/70"
              }
            >
              {formatTime(m.created_at)}
            </p>
          </div>
        ))}
      </div>
    </ProtectedLayout>
  );
}

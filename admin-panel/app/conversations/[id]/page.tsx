"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ProtectedLayout } from "@/components/ProtectedLayout";
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
    <ProtectedLayout>
      <Link href="/conversations" className="mb-4 inline-block text-sm text-neutral-500 hover:text-neutral-900">
        ← Все диалоги
      </Link>
      <h1 className="mb-6 text-lg font-semibold text-neutral-900">Переписка</h1>

      {messages === null && <p className="text-sm text-neutral-500">Загрузка…</p>}

      <div className="flex flex-col gap-3">
        {messages?.map((m) => (
          <div
            key={m.id}
            className={
              m.direction === "inbound"
                ? "mr-auto max-w-lg rounded-lg rounded-bl-none bg-white border border-neutral-200 px-4 py-2"
                : "ml-auto max-w-lg rounded-lg rounded-br-none bg-neutral-900 text-white px-4 py-2"
            }
          >
            <p className="whitespace-pre-wrap text-sm">{m.body}</p>
            <p
              className={
                m.direction === "inbound"
                  ? "mt-1 text-xs text-neutral-400"
                  : "mt-1 text-xs text-neutral-300"
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

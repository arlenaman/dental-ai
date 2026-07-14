"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { Card, PageSpinner } from "@/components/ui";
import { api } from "@/lib/api";
import type { AppointmentListItem, Conversation } from "@/lib/types";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<AppointmentListItem[] | null>(null);
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  // Lazy initializer: runs once on mount, not on every render — the sanctioned
  // escape hatch for an impure read like Date.now().
  const [now] = useState(() => Date.now());

  useEffect(() => {
    api.get<AppointmentListItem[]>(`/appointments?date=${todayIso()}`).then(setAppointments);
    api.get<Conversation[]>("/conversations").then(setConversations);
  }, []);

  const loading = appointments === null || conversations === null;

  const scheduledToday = (appointments ?? []).filter((a) => a.status === "scheduled");
  const nextAppointment = scheduledToday
    .filter((a) => new Date(a.starts_at).getTime() >= now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0];

  const openConversations = (conversations ?? []).filter((c) => c.status === "open");

  return (
    <ProtectedLayout title="Обзор">
      {loading ? (
        <PageSpinner />
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <p className="text-sm text-text-muted">Записей сегодня</p>
              <p className="mt-1 text-2xl font-semibold text-text">{scheduledToday.length}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-text-muted">Ближайшая запись</p>
              <p className="mt-1 text-2xl font-semibold text-text">
                {nextAppointment ? formatTime(nextAppointment.starts_at) : "—"}
              </p>
              {nextAppointment && (
                <p className="mt-1 truncate text-xs text-text-muted">
                  {nextAppointment.patient_name} · {nextAppointment.service_name}
                </p>
              )}
            </Card>
            <Card className="p-5">
              <p className="text-sm text-text-muted">Открытых диалогов</p>
              <p className="mt-1 text-2xl font-semibold text-text">{openConversations.length}</p>
            </Card>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-text">Последние диалоги</h2>
            <Link href="/conversations" className="text-sm text-accent-strong hover:underline">
              Все диалоги →
            </Link>
          </div>
          <Card className="divide-y divide-border">
            {conversations && conversations.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-text-muted">Пока нет диалогов</p>
            )}
            {conversations?.slice(0, 5).map((c) => (
              <Link
                key={c.id}
                href={`/conversations/${c.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-surface-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text">{c.patient_name}</span>
                    <span className="text-xs text-text-muted">{c.patient_phone}</span>
                  </div>
                  <p className="truncate text-sm text-text-muted">
                    {c.last_message_preview ?? "Нет сообщений"}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-text-muted">
                  {formatDateTime(c.last_message_at)}
                </span>
              </Link>
            ))}
          </Card>
        </>
      )}
    </ProtectedLayout>
  );
}

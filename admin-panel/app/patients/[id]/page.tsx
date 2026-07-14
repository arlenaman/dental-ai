"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { Badge, Card, EmptyState, PageSpinner } from "@/components/ui";
import { api } from "@/lib/api";
import type { AppointmentListItem, AppointmentStatus, Patient } from "@/lib/types";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/types";

const STATUS_BADGE: Record<AppointmentStatus, "success" | "danger" | "warning" | "neutral"> = {
  scheduled: "success",
  completed: "neutral",
  cancelled: "danger",
  no_show: "warning",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const LANGUAGE_LABELS: Record<string, string> = { ru: "Русский", kk: "Қазақша" };

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<AppointmentListItem[] | null>(null);

  useEffect(() => {
    api.get<Patient>(`/patients/${params.id}`).then(setPatient);
    api.get<AppointmentListItem[]>(`/appointments?patient_id=${params.id}`).then(setAppointments);
  }, [params.id]);

  return (
    <ProtectedLayout title="Карточка пациента">
      <Link
        href="/patients"
        className="mb-4 inline-block text-sm text-text-muted hover:text-text"
      >
        ← Все пациенты
      </Link>

      {!patient && <PageSpinner />}

      {patient && (
        <Card className="mb-6 p-5">
          <p className="text-lg font-semibold text-text">{patient.full_name}</p>
          <p className="mt-1 text-sm text-text-muted">{patient.phone}</p>
          <p className="mt-1 text-sm text-text-muted">
            Язык общения: {LANGUAGE_LABELS[patient.preferred_language] ?? patient.preferred_language}
          </p>
        </Card>
      )}

      <h2 className="mb-3 text-sm font-medium text-text">История записей</h2>

      {appointments === null && <PageSpinner />}

      {appointments && appointments.length === 0 && (
        <EmptyState title="Записей пока нет" />
      )}

      {appointments && appointments.length > 0 && (
        <Card className="divide-y divide-border">
          {appointments.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="font-medium text-text">{a.service_name}</p>
                <p className="text-sm text-text-muted">
                  {formatDateTime(a.starts_at)} · {a.staff_name}
                </p>
              </div>
              <Badge variant={STATUS_BADGE[a.status]}>{APPOINTMENT_STATUS_LABELS[a.status]}</Badge>
            </div>
          ))}
        </Card>
      )}
    </ProtectedLayout>
  );
}

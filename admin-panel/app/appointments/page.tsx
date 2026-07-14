"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { Badge, Button, Card, ConfirmDialog, EmptyState, PageSpinner, Select, useToast } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { AppointmentListItem, AppointmentStatus, Service, Staff } from "@/lib/types";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/types";
import { NewAppointmentModal } from "./NewAppointmentModal";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_BADGE: Record<AppointmentStatus, "success" | "danger" | "warning" | "neutral"> = {
  scheduled: "success",
  completed: "neutral",
  cancelled: "danger",
  no_show: "warning",
};

export default function AppointmentsPage() {
  const { show } = useToast();
  const [date, setDate] = useState(todayIso());
  const [staffFilter, setStaffFilter] = useState("");
  const [appointments, setAppointments] = useState<AppointmentListItem[] | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<AppointmentListItem | null>(null);

  const reload = useCallback(() => {
    const params = new URLSearchParams({ date });
    if (staffFilter) params.set("staff_id", staffFilter);
    api.get<AppointmentListItem[]>(`/appointments?${params.toString()}`).then(setAppointments);
  }, [date, staffFilter]);

  useEffect(reload, [reload]);

  useEffect(() => {
    api.get<Staff[]>("/staff").then(setStaffList);
    api.get<Service[]>("/services").then(setServices);
  }, []);

  async function handleCancel() {
    if (!cancelTarget) return;
    try {
      await api.post(`/appointments/${cancelTarget.id}/cancel`);
      show("Запись отменена", "success");
      reload();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Не удалось отменить запись", "error");
    }
  }

  return (
    <ProtectedLayout
      title="Записи"
      actions={<Button onClick={() => setModalOpen(true)}>+ Новая запись</Button>}
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <Select
          value={staffFilter}
          onChange={(e) => setStaffFilter(e.target.value)}
          className="w-auto"
        >
          <option value="">Все врачи</option>
          {staffList
            .filter((s) => s.is_active)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
        </Select>
      </div>

      {appointments === null && <PageSpinner />}

      {appointments && appointments.length === 0 && (
        <EmptyState
          title="Нет записей на эту дату"
          description="Измените дату или создайте новую запись."
        />
      )}

      {appointments && appointments.length > 0 && (
        <Card className="divide-y divide-border">
          {appointments.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex items-center gap-4 min-w-0">
                <span className="w-14 shrink-0 font-mono text-sm text-text">
                  {formatTime(a.starts_at)}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-text">{a.patient_name}</span>
                    <span className="shrink-0 text-xs text-text-muted">{a.patient_phone}</span>
                  </div>
                  <p className="truncate text-sm text-text-muted">
                    {a.service_name} · {a.staff_name}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Badge variant={STATUS_BADGE[a.status]}>{APPOINTMENT_STATUS_LABELS[a.status]}</Badge>
                {a.status === "scheduled" && (
                  <Button variant="ghost" size="sm" onClick={() => setCancelTarget(a)}>
                    Отменить
                  </Button>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}

      <NewAppointmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={reload}
        services={services}
        staffList={staffList}
        defaultDate={date}
      />

      <ConfirmDialog
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Отменить запись?"
        description={
          cancelTarget
            ? `${cancelTarget.patient_name} — ${cancelTarget.service_name}, ${formatTime(cancelTarget.starts_at)}`
            : ""
        }
        confirmLabel="Отменить запись"
        danger
      />
    </ProtectedLayout>
  );
}

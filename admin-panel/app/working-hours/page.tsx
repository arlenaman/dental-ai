"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import {
  Button,
  Card,
  ConfirmDialog,
  Field,
  Input,
  Modal,
  PageSpinner,
  Select,
  useToast,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { Staff, WorkingHoursEntry } from "@/lib/types";
import { WEEKDAY_LABELS } from "@/lib/types";

function AddHoursForm({
  onClose,
  onSaved,
  staffList,
}: {
  onClose: () => void;
  onSaved: () => void;
  staffList: Staff[];
}) {
  const [staffId, setStaffId] = useState("");
  const [weekday, setWeekday] = useState("0");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/working-hours", {
        staff_id: staffId || null,
        weekday: Number(weekday),
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось сохранить расписание");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Врач">
        <Select value={staffId} onChange={(e) => setStaffId(e.target.value)}>
          <option value="">Вся клиника (по умолчанию)</option>
          {staffList
            .filter((s) => s.is_active)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
        </Select>
      </Field>
      <Field label="День недели">
        <Select value={weekday} onChange={(e) => setWeekday(e.target.value)}>
          {WEEKDAY_LABELS.map((label, idx) => (
            <option key={idx} value={idx}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Начало">
          <Input
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </Field>
        <Field label="Окончание">
          <Input
            type="time"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </Field>
      </div>
      {error && <p className="mb-4 text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Отмена
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Сохраняем…" : "Добавить"}
        </Button>
      </div>
    </form>
  );
}

function AddHoursModal({
  open,
  onClose,
  onSaved,
  staffList,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  staffList: Staff[];
}) {
  return (
    <Modal open={open} onClose={onClose} title="Добавить рабочие часы">
      {open && <AddHoursForm onClose={onClose} onSaved={onSaved} staffList={staffList} />}
    </Modal>
  );
}

export default function WorkingHoursPage() {
  const { show } = useToast();
  const [entries, setEntries] = useState<WorkingHoursEntry[] | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WorkingHoursEntry | null>(null);

  function reload() {
    api.get<WorkingHoursEntry[]>("/working-hours").then(setEntries);
  }

  useEffect(() => {
    reload();
    api.get<Staff[]>("/staff").then(setStaffList);
  }, []);

  function staffName(id: string | null) {
    if (id === null) return "Вся клиника";
    return staffList.find((s) => s.id === id)?.full_name ?? "—";
  }

  async function remove() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/working-hours/${deleteTarget.id}`);
      show("Удалено", "success");
      reload();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Не удалось удалить", "error");
    }
  }

  return (
    <ProtectedLayout
      title="Рабочее расписание"
      actions={<Button onClick={() => setModalOpen(true)}>+ Добавить часы</Button>}
    >
      {entries === null && <PageSpinner />}

      {entries && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {WEEKDAY_LABELS.map((label, weekday) => {
            const dayEntries = entries.filter((e) => e.weekday === weekday);
            return (
              <Card key={weekday} className="p-4">
                <h3 className="mb-2 text-sm font-semibold text-text">{label}</h3>
                {dayEntries.length === 0 && (
                  <p className="text-sm text-text-muted">Выходной</p>
                )}
                <div className="flex flex-col gap-2">
                  {dayEntries.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between gap-2 rounded-md bg-surface-2 px-2.5 py-1.5"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-sm text-text">
                          {e.start_time.slice(0, 5)}–{e.end_time.slice(0, 5)}
                        </p>
                        <p className="truncate text-xs text-text-muted">{staffName(e.staff_id)}</p>
                      </div>
                      <button
                        onClick={() => setDeleteTarget(e)}
                        className="shrink-0 text-xs text-text-muted hover:text-danger"
                        aria-label="Удалить"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AddHoursModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={reload}
        staffList={staffList}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title="Удалить рабочие часы?"
        description={
          deleteTarget
            ? `${WEEKDAY_LABELS[deleteTarget.weekday]}, ${deleteTarget.start_time.slice(0, 5)}–${deleteTarget.end_time.slice(0, 5)}`
            : ""
        }
        confirmLabel="Удалить"
        danger
      />
    </ProtectedLayout>
  );
}

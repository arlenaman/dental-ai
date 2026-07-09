"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { api, ApiError } from "@/lib/api";
import type { Staff, WorkingHoursEntry } from "@/lib/types";
import { WEEKDAY_LABELS } from "@/lib/types";

export default function WorkingHoursPage() {
  const [entries, setEntries] = useState<WorkingHoursEntry[] | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [staffId, setStaffId] = useState<string>("");
  const [weekday, setWeekday] = useState("0");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reload() {
    api.get<WorkingHoursEntry[]>("/working-hours").then(setEntries);
  }

  useEffect(() => {
    reload();
    api.get<Staff[]>("/staff").then(setStaffList);
  }, []);

  function staffName(id: string | null) {
    if (id === null) return "Вся клиника (по умолчанию)";
    return staffList.find((s) => s.id === id)?.full_name ?? id;
  }

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
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось сохранить расписание");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    await api.delete(`/working-hours/${id}`);
    reload();
  }

  return (
    <ProtectedLayout>
      <h1 className="mb-6 text-lg font-semibold text-neutral-900">Рабочее расписание</h1>

      <div className="mb-8 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
        {entries?.map((e) => (
          <div key={e.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <span className="font-medium text-neutral-900">{WEEKDAY_LABELS[e.weekday]}</span>
              <span className="ml-2 text-sm text-neutral-500">
                {e.start_time.slice(0, 5)}–{e.end_time.slice(0, 5)} · {staffName(e.staff_id)}
              </span>
            </div>
            <button
              onClick={() => remove(e.id)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              удалить
            </button>
          </div>
        ))}
        {entries?.length === 0 && (
          <p className="px-4 py-3 text-sm text-neutral-500">Расписание ещё не задано.</p>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-md rounded-lg border border-neutral-200 bg-white p-4"
      >
        <h2 className="mb-3 text-sm font-medium text-neutral-900">Добавить рабочий день</h2>

        <div className="mb-3">
          <label className="mb-1 block text-sm text-neutral-700">Врач</label>
          <select
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">Вся клиника (по умолчанию)</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-sm text-neutral-700">День недели</label>
          <select
            value={weekday}
            onChange={(e) => setWeekday(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            {WEEKDAY_LABELS.map((label, idx) => (
              <option key={idx} value={idx}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3 flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm text-neutral-700">Начало</label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm text-neutral-700">Окончание</label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          Добавить
        </button>
      </form>
    </ProtectedLayout>
  );
}

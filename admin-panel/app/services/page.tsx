"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { api, ApiError } from "@/lib/api";
import type { Service } from "@/lib/types";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[] | null>(null);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reload() {
    api.get<Service[]>("/services").then(setServices);
  }

  useEffect(reload, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/services", {
        name,
        duration_minutes: Number(duration),
        price_amount: Number(price),
        price_currency: "KZT",
      });
      setName("");
      setDuration("30");
      setPrice("");
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось сохранить услугу");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(service: Service) {
    await api.patch(`/services/${service.id}`, { is_active: !service.is_active });
    reload();
  }

  return (
    <ProtectedLayout>
      <h1 className="mb-6 text-lg font-semibold text-neutral-900">Услуги клиники</h1>

      <div className="mb-8 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
        {services?.map((s) => (
          <div key={s.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <span className="font-medium text-neutral-900">{s.name}</span>
              <span className="ml-2 text-sm text-neutral-500">
                {s.duration_minutes} мин · {s.price_amount} {s.price_currency}
              </span>
            </div>
            <button
              onClick={() => toggleActive(s)}
              className={
                s.is_active
                  ? "text-xs text-neutral-500 hover:text-neutral-900"
                  : "text-xs text-red-500 hover:text-red-700"
              }
            >
              {s.is_active ? "активна" : "отключена — включить"}
            </button>
          </div>
        ))}
        {services?.length === 0 && (
          <p className="px-4 py-3 text-sm text-neutral-500">Услуг пока нет.</p>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-md rounded-lg border border-neutral-200 bg-white p-4"
      >
        <h2 className="mb-3 text-sm font-medium text-neutral-900">Добавить услугу</h2>
        <div className="mb-3">
          <label className="mb-1 block text-sm text-neutral-700">Название</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="mb-3 flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm text-neutral-700">Длительность (мин)</label>
            <input
              type="number"
              required
              min={5}
              max={480}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm text-neutral-700">Цена (KZT)</label>
            <input
              type="number"
              required
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
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

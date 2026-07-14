"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  PageSpinner,
  useToast,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { Service } from "@/lib/types";

function ServiceForm({
  onClose,
  onSaved,
  service,
}: {
  onClose: () => void;
  onSaved: () => void;
  service: Service | null;
}) {
  const { show } = useToast();
  const [name, setName] = useState(service?.name ?? "");
  const [duration, setDuration] = useState(service ? String(service.duration_minutes) : "30");
  const [price, setPrice] = useState(service ? String(service.price_amount) : "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        name,
        duration_minutes: Number(duration),
        price_amount: Number(price),
        price_currency: "KZT",
      };
      if (service) {
        await api.patch(`/services/${service.id}`, payload);
        show("Услуга обновлена", "success");
      } else {
        await api.post("/services", payload);
        show("Услуга добавлена", "success");
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось сохранить услугу");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Название">
        <Input required value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Длительность (мин)">
          <Input
            type="number"
            required
            min={5}
            max={480}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </Field>
        <Field label="Цена (KZT)">
          <Input
            type="number"
            required
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </Field>
      </div>
      {error && <p className="mb-4 text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Отмена
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Сохраняем…" : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}

function ServiceFormModal({
  open,
  onClose,
  onSaved,
  service,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  service: Service | null;
}) {
  return (
    <Modal open={open} onClose={onClose} title={service ? "Редактировать услугу" : "Новая услуга"}>
      {open && <ServiceForm onClose={onClose} onSaved={onSaved} service={service} />}
    </Modal>
  );
}

export default function ServicesPage() {
  const { show } = useToast();
  const [services, setServices] = useState<Service[] | null>(null);
  const [formTarget, setFormTarget] = useState<Service | null | "new">(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Service | null>(null);

  function reload() {
    api.get<Service[]>("/services").then(setServices);
  }

  useEffect(reload, []);

  async function activate(service: Service) {
    try {
      await api.patch(`/services/${service.id}`, { is_active: true });
      reload();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Не удалось включить услугу", "error");
    }
  }

  async function deactivate() {
    if (!deactivateTarget) return;
    try {
      await api.patch(`/services/${deactivateTarget.id}`, { is_active: false });
      show("Услуга отключена", "success");
      reload();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Не удалось отключить услугу", "error");
    }
  }

  return (
    <ProtectedLayout
      title="Услуги клиники"
      actions={<Button onClick={() => setFormTarget("new")}>+ Новая услуга</Button>}
    >
      {services === null && <PageSpinner />}

      {services && services.length === 0 && (
        <EmptyState title="Услуг пока нет" description="Добавьте первую услугу клиники." />
      )}

      {services && services.length > 0 && (
        <Card className="divide-y divide-border">
          {services.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-text">{s.name}</span>
                <span className="text-sm text-text-muted">
                  {s.duration_minutes} мин · {s.price_amount} {s.price_currency}
                </span>
                {!s.is_active && <Badge variant="neutral">Отключена</Badge>}
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setFormTarget(s)}>
                  Изменить
                </Button>
                {s.is_active ? (
                  <Button variant="ghost" size="sm" onClick={() => setDeactivateTarget(s)}>
                    Отключить
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => activate(s)}>
                    Включить
                  </Button>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}

      <ServiceFormModal
        open={formTarget !== null}
        onClose={() => setFormTarget(null)}
        onSaved={reload}
        service={formTarget === "new" ? null : formTarget}
      />

      <ConfirmDialog
        open={deactivateTarget !== null}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={deactivate}
        title="Отключить услугу?"
        description={
          deactivateTarget
            ? `«${deactivateTarget.name}» больше не будет предлагаться ассистентом и не появится в форме новой записи.`
            : ""
        }
        confirmLabel="Отключить"
        danger
      />
    </ProtectedLayout>
  );
}

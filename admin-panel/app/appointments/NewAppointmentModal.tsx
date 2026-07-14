"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui";
import { Button, Field, Input, Modal, Select } from "@/components/ui";
import type { Patient, Service, Staff } from "@/lib/types";

interface AppointmentFormProps {
  onClose: () => void;
  onCreated: () => void;
  services: Service[];
  staffList: Staff[];
  defaultDate: string;
}

function AppointmentForm({
  onClose,
  onCreated,
  services,
  staffList,
  defaultDate,
}: AppointmentFormProps) {
  const { show } = useToast();
  const activeServices = services.filter((s) => s.is_active);
  const activeStaff = staffList.filter((s) => s.is_active);

  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  // "" means "no explicit user choice yet" — fall back to the first active
  // option every render instead of freezing a possibly-still-empty list at
  // mount time (services/staff can still be loading when the modal opens).
  const [serviceIdChoice, setServiceIdChoice] = useState("");
  const [staffIdChoice, setStaffIdChoice] = useState("");
  const serviceId = serviceIdChoice || (activeServices[0]?.id ?? "");
  const staffId = staffIdChoice || (activeStaff[0]?.id ?? "");
  const [date, setDate] = useState(defaultDate);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!serviceId || !staffId || !date) return;
    // Canonical React data-fetch-on-dependency-change pattern (react.dev/learn/
    // synchronizing-with-effects#fetching-data): set loading synchronously,
    // then resolve async. There's no derived-state alternative here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingSlots(true);
    setSelectedSlot(null);
    api
      .get<string[]>(`/schedule/slots?staff_id=${staffId}&service_id=${serviceId}&date=${date}`)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [serviceId, staffId, date]);

  async function handleSubmit() {
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      const patient = await api.post<Patient>("/patients", {
        phone,
        full_name: fullName,
        preferred_language: "ru",
      });
      await api.post("/appointments", {
        patient_id: patient.id,
        staff_id: staffId,
        service_id: serviceId,
        starts_at: selectedSlot,
      });
      show("Запись создана", "success");
      onCreated();
      onClose();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Не удалось создать запись", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Телефон пациента">
          <Input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 700 000 0000"
          />
        </Field>
        <Field label="Имя пациента">
          <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Услуга">
          <Select value={serviceId} onChange={(e) => setServiceIdChoice(e.target.value)}>
            {activeServices.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.duration_minutes} мин
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Врач">
          <Select value={staffId} onChange={(e) => setStaffIdChoice(e.target.value)}>
            {activeStaff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Дата">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>

      <Field label="Свободное время">
        {loadingSlots && <p className="text-sm text-text-muted">Загрузка слотов…</p>}
        {!loadingSlots && slots && slots.length === 0 && (
          <p className="text-sm text-text-muted">Нет свободных слотов на эту дату.</p>
        )}
        {!loadingSlots && slots && slots.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => {
              const time = new Date(slot).toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const active = slot === selectedSlot;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={
                    active
                      ? "rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg"
                      : "rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text hover:bg-surface-2"
                  }
                >
                  {time}
                </button>
              );
            })}
          </div>
        )}
      </Field>

      <div className="mt-2 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!selectedSlot || !phone || !fullName || submitting}
        >
          {submitting ? "Создаём…" : "Создать запись"}
        </Button>
      </div>
    </div>
  );
}

export function NewAppointmentModal({
  open,
  onClose,
  onCreated,
  services,
  staffList,
  defaultDate,
}: AppointmentFormProps & { open: boolean }) {
  return (
    <Modal open={open} onClose={onClose} title="Новая запись">
      {open && (
        <AppointmentForm
          onClose={onClose}
          onCreated={onCreated}
          services={services}
          staffList={staffList}
          defaultDate={defaultDate}
        />
      )}
    </Modal>
  );
}

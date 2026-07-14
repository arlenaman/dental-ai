"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
  PageSpinner,
  Select,
  useToast,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Staff, StaffRole } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";

export default function StaffPage() {
  const { staff: currentStaff } = useAuth();
  const { show } = useToast();
  const isAdmin = currentStaff?.role === "owner" || currentStaff?.role === "admin";

  const [staffList, setStaffList] = useState<Staff[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<StaffRole>("dentist");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reload() {
    api.get<Staff[]>("/staff").then(setStaffList);
  }

  useEffect(reload, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/staff", { full_name: fullName, email, password, role });
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("dentist");
      setModalOpen(false);
      show("Сотрудник добавлен", "success");
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось добавить сотрудника");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(member: Staff) {
    try {
      await api.patch(`/staff/${member.id}`, { is_active: !member.is_active });
      reload();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Не удалось изменить статус", "error");
    }
  }

  return (
    <ProtectedLayout
      title="Персонал"
      actions={
        isAdmin && <Button onClick={() => setModalOpen(true)}>+ Пригласить сотрудника</Button>
      }
    >
      {staffList === null && <PageSpinner />}

      {staffList && (
        <Card className="divide-y divide-border">
          {staffList.map((member) => (
            <div key={member.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text">{member.full_name}</span>
                  <Badge variant="neutral">{ROLE_LABELS[member.role]}</Badge>
                  {!member.is_active && <Badge variant="danger">Отключён</Badge>}
                </div>
                <p className="text-sm text-text-muted">{member.email}</p>
              </div>
              {isAdmin && member.id !== currentStaff?.id && (
                <Button variant="ghost" size="sm" onClick={() => toggleActive(member)}>
                  {member.is_active ? "Отключить" : "Включить"}
                </Button>
              )}
            </div>
          ))}
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Пригласить сотрудника">
        <form onSubmit={handleSubmit}>
          <Field label="Имя">
            <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Временный пароль" hint="Минимум 8 символов">
            <Input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field label="Роль">
            <Select value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
              <option value="dentist">Врач</option>
              <option value="admin">Администратор</option>
              <option value="owner">Владелец</option>
            </Select>
          </Field>

          {error && <p className="mb-4 text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Добавляем…" : "Добавить"}
            </Button>
          </div>
        </form>
      </Modal>
    </ProtectedLayout>
  );
}

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  PageSpinner,
  Textarea,
  useToast,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { FaqEntry } from "@/lib/types";

function FaqForm({
  onClose,
  onSaved,
  entry,
}: {
  onClose: () => void;
  onSaved: () => void;
  entry: FaqEntry | null;
}) {
  const { show } = useToast();
  const [question, setQuestion] = useState(entry?.question ?? "");
  const [answer, setAnswer] = useState(entry?.answer ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (entry) {
        await api.patch(`/faq/${entry.id}`, { question, answer });
        show("Запись обновлена", "success");
      } else {
        await api.post("/faq", { question, answer });
        show("Запись добавлена", "success");
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось сохранить запись");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Вопрос">
        <Input
          required
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Например: нужна ли подготовка к чистке?"
        />
      </Field>
      <Field label="Ответ">
        <Textarea required rows={3} value={answer} onChange={(e) => setAnswer(e.target.value)} />
      </Field>
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

function FaqFormModal({
  open,
  onClose,
  onSaved,
  entry,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  entry: FaqEntry | null;
}) {
  return (
    <Modal open={open} onClose={onClose} title={entry ? "Редактировать запись" : "Новый вопрос-ответ"}>
      {open && <FaqForm onClose={onClose} onSaved={onSaved} entry={entry} />}
    </Modal>
  );
}

export default function FaqPage() {
  const { show } = useToast();
  const [entries, setEntries] = useState<FaqEntry[] | null>(null);
  const [formTarget, setFormTarget] = useState<FaqEntry | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<FaqEntry | null>(null);

  function reload() {
    api.get<FaqEntry[]>("/faq").then(setEntries);
  }

  useEffect(reload, []);

  async function remove() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/faq/${deleteTarget.id}`);
      show("Запись удалена", "success");
      reload();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Не удалось удалить запись", "error");
    }
  }

  return (
    <ProtectedLayout
      title="База знаний для ассистента"
      actions={<Button onClick={() => setFormTarget("new")}>+ Вопрос-ответ</Button>}
    >
      {entries === null && <PageSpinner />}

      {entries && entries.length === 0 && (
        <EmptyState
          title="Записей пока нет"
          description="Ассистент будет отвечать только тем, что знает из общих инструментов записи."
        />
      )}

      {entries && entries.length > 0 && (
        <Card className="divide-y divide-border">
          {entries.map((e) => (
            <div key={e.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-text">{e.question}</p>
                  <p className="mt-1 text-sm text-text-muted">{e.answer}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={() => setFormTarget(e)}>
                    Изменить
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(e)}>
                    Удалить
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}

      <FaqFormModal
        open={formTarget !== null}
        onClose={() => setFormTarget(null)}
        onSaved={reload}
        entry={formTarget === "new" ? null : formTarget}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title="Удалить запись?"
        description={deleteTarget ? `«${deleteTarget.question}» будет удалена без возможности восстановления.` : ""}
        confirmLabel="Удалить"
        danger
      />
    </ProtectedLayout>
  );
}

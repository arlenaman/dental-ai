"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { api, ApiError } from "@/lib/api";
import type { FaqEntry } from "@/lib/types";

export default function FaqPage() {
  const [entries, setEntries] = useState<FaqEntry[] | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reload() {
    api.get<FaqEntry[]>("/faq").then(setEntries);
  }

  useEffect(reload, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/faq", { question, answer });
      setQuestion("");
      setAnswer("");
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось сохранить запись");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    await api.delete(`/faq/${id}`);
    reload();
  }

  return (
    <ProtectedLayout>
      <h1 className="mb-6 text-lg font-semibold text-neutral-900">
        База знаний для ассистента
      </h1>

      <div className="mb-8 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
        {entries?.map((e) => (
          <div key={e.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-neutral-900">{e.question}</p>
                <p className="mt-1 text-sm text-neutral-500">{e.answer}</p>
              </div>
              <button
                onClick={() => remove(e.id)}
                className="shrink-0 text-xs text-red-500 hover:text-red-700"
              >
                удалить
              </button>
            </div>
          </div>
        ))}
        {entries?.length === 0 && (
          <p className="px-4 py-3 text-sm text-neutral-500">
            Записей пока нет — ассистент будет отвечать только тем, что знает из общих
            инструментов записи.
          </p>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-lg rounded-lg border border-neutral-200 bg-white p-4"
      >
        <h2 className="mb-3 text-sm font-medium text-neutral-900">Добавить вопрос-ответ</h2>
        <div className="mb-3">
          <label className="mb-1 block text-sm text-neutral-700">Вопрос</label>
          <input
            required
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            placeholder="Например: нужна ли подготовка к чистке?"
          />
        </div>
        <div className="mb-3">
          <label className="mb-1 block text-sm text-neutral-700">Ответ</label>
          <textarea
            required
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
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

export type StaffRole = "owner" | "admin" | "dentist";

export interface Staff {
  id: string;
  clinic_id: string;
  full_name: string;
  email: string;
  role: StaffRole;
  is_active: boolean;
}

export interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price_amount: string;
  price_currency: string;
  is_active: boolean;
}

export interface WorkingHoursEntry {
  id: string;
  staff_id: string | null;
  weekday: number;
  start_time: string;
  end_time: string;
}

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  is_active: boolean;
}

export type ConversationStatus = "open" | "closed";
export type MessageDirection = "inbound" | "outbound";

export interface Conversation {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  status: ConversationStatus;
  last_message_at: string | null;
  last_message_preview: string | null;
}

export interface Message {
  id: string;
  direction: MessageDirection;
  body: string;
  created_at: string;
}

export const WEEKDAY_LABELS = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];

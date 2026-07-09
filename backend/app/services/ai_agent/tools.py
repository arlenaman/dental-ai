import json
import uuid
from datetime import date as date_type
from datetime import datetime

from anthropic import beta_async_tool
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.appointment import Appointment, AppointmentStatus
from app.models.service import Service
from app.models.staff import Staff
from app.services.ai_agent.faq_search import search_faq
from app.services.scheduling import (
    SlotUnavailableError,
    book_appointment,
    cancel_appointment,
    get_available_slots,
    reschedule_appointment,
)


def build_tools(db: AsyncSession, clinic_id: uuid.UUID, patient_id: uuid.UUID) -> list:
    """Build tool-runner tools scoped to one clinic and one patient.

    Closures capture db/clinic_id/patient_id so the model only ever sees the
    arguments it should actually control — clinic/patient scoping is enforced
    here, not left to the model to get right.
    """

    @beta_async_tool
    async def list_services() -> str:
        """List the dental services this clinic offers, with duration and price."""
        result = await db.execute(
            select(Service).where(Service.clinic_id == clinic_id, Service.is_active.is_(True))
        )
        return json.dumps(
            [
                {
                    "id": str(s.id),
                    "name": s.name,
                    "duration_minutes": s.duration_minutes,
                    "price": f"{s.price_amount} {s.price_currency}",
                }
                for s in result.scalars().all()
            ],
            ensure_ascii=False,
        )

    @beta_async_tool
    async def list_staff() -> str:
        """List the dentists working at this clinic."""
        result = await db.execute(
            select(Staff).where(Staff.clinic_id == clinic_id, Staff.is_active.is_(True))
        )
        return json.dumps(
            [{"id": str(s.id), "full_name": s.full_name} for s in result.scalars().all()],
            ensure_ascii=False,
        )

    @beta_async_tool
    async def get_available_slots_tool(staff_id: str, service_id: str, date: str) -> str:
        """Get available appointment slots for a dentist and service on a given date.

        Args:
            staff_id: The dentist's id, from list_staff.
            service_id: The service's id, from list_services.
            date: Date to check, in YYYY-MM-DD format.
        """
        try:
            slots = await get_available_slots(
                db, clinic_id, uuid.UUID(staff_id), uuid.UUID(service_id), date_type.fromisoformat(date)
            )
        except ValueError as exc:
            return f"error: {exc}"
        return json.dumps([s.isoformat() for s in slots])

    @beta_async_tool
    async def book_appointment_tool(staff_id: str, service_id: str, starts_at: str) -> str:
        """Book an appointment for the current patient at a specific available slot.

        Args:
            staff_id: The dentist's id.
            service_id: The service's id.
            starts_at: Appointment start time in ISO 8601 with timezone offset,
                e.g. 2026-07-13T10:00:00+05:00 — must be one of the times
                returned by get_available_slots_tool.
        """
        try:
            appointment = await book_appointment(
                db, clinic_id, patient_id, uuid.UUID(staff_id), uuid.UUID(service_id), datetime.fromisoformat(starts_at)
            )
        except SlotUnavailableError as exc:
            return f"error: {exc}"
        except ValueError as exc:
            return f"error: {exc}"
        return f"booked: appointment_id={appointment.id} starts_at={appointment.starts_at.isoformat()}"

    @beta_async_tool
    async def list_my_appointments() -> str:
        """List the current patient's own upcoming scheduled appointments."""
        result = await db.execute(
            select(Appointment)
            .where(
                Appointment.clinic_id == clinic_id,
                Appointment.patient_id == patient_id,
                Appointment.status == AppointmentStatus.SCHEDULED,
            )
            .order_by(Appointment.starts_at)
        )
        return json.dumps(
            [
                {
                    "id": str(a.id),
                    "starts_at": a.starts_at.isoformat(),
                    "staff_id": str(a.staff_id),
                    "service_id": str(a.service_id),
                }
                for a in result.scalars().all()
            ]
        )

    async def _get_own_appointment(appointment_id: str) -> Appointment | None:
        appt = await db.get(Appointment, uuid.UUID(appointment_id))
        if appt is None or appt.clinic_id != clinic_id or appt.patient_id != patient_id:
            return None
        return appt

    @beta_async_tool
    async def reschedule_appointment_tool(appointment_id: str, new_starts_at: str) -> str:
        """Reschedule one of the current patient's own appointments to a new time.

        Args:
            appointment_id: The appointment's id, from list_my_appointments.
            new_starts_at: New start time in ISO 8601 with timezone offset.
        """
        if await _get_own_appointment(appointment_id) is None:
            return "error: запись не найдена у этого пациента"
        try:
            appointment = await reschedule_appointment(
                db, clinic_id, uuid.UUID(appointment_id), datetime.fromisoformat(new_starts_at)
            )
        except SlotUnavailableError as exc:
            return f"error: {exc}"
        except ValueError as exc:
            return f"error: {exc}"
        return f"rescheduled: starts_at={appointment.starts_at.isoformat()}"

    @beta_async_tool
    async def cancel_appointment_tool(appointment_id: str) -> str:
        """Cancel one of the current patient's own appointments.

        Args:
            appointment_id: The appointment's id, from list_my_appointments.
        """
        if await _get_own_appointment(appointment_id) is None:
            return "error: запись не найдена у этого пациента"
        try:
            await cancel_appointment(db, clinic_id, uuid.UUID(appointment_id))
        except ValueError as exc:
            return f"error: {exc}"
        return "cancelled"

    @beta_async_tool
    async def search_clinic_faq(query: str) -> str:
        """Search the clinic's FAQ knowledge base (hours, prices, policies, prep instructions, etc).

        Args:
            query: What the patient is asking about, in their own words.
        """
        entries = await search_faq(db, clinic_id, query)
        if not entries:
            return "no matching FAQ entries"
        return json.dumps(
            [{"question": e.question, "answer": e.answer} for e in entries], ensure_ascii=False
        )

    return [
        list_services,
        list_staff,
        get_available_slots_tool,
        book_appointment_tool,
        list_my_appointments,
        reschedule_appointment_tool,
        cancel_appointment_tool,
        search_clinic_faq,
    ]

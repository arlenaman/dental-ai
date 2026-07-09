import uuid
from datetime import date, datetime, timedelta

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.appointment import Appointment, AppointmentStatus
from app.models.service import Service
from app.models.working_hours import WorkingHours
from app.services.scheduling.timezone import CLINIC_TZ


async def get_available_slots(
    db: AsyncSession,
    clinic_id: uuid.UUID,
    staff_id: uuid.UUID,
    service_id: uuid.UUID,
    on_date: date,
) -> list[datetime]:
    service = await db.get(Service, service_id)
    if service is None or service.clinic_id != clinic_id:
        raise ValueError("Услуга не найдена")

    weekday = on_date.weekday()
    result = await db.execute(
        select(WorkingHours).where(
            WorkingHours.clinic_id == clinic_id,
            WorkingHours.weekday == weekday,
            or_(WorkingHours.staff_id == staff_id, WorkingHours.staff_id.is_(None)),
        )
    )
    hours_rows = result.scalars().all()
    if not hours_rows:
        return []

    # A staff-specific row overrides the clinic-wide default for that weekday.
    working_hours = next((h for h in hours_rows if h.staff_id == staff_id), hours_rows[0])

    duration = timedelta(minutes=service.duration_minutes)
    day_start = datetime.combine(on_date, working_hours.start_time, tzinfo=CLINIC_TZ)
    day_end = datetime.combine(on_date, working_hours.end_time, tzinfo=CLINIC_TZ)

    busy_result = await db.execute(
        select(Appointment).where(
            Appointment.clinic_id == clinic_id,
            Appointment.staff_id == staff_id,
            Appointment.status == AppointmentStatus.SCHEDULED,
            Appointment.starts_at < day_end,
            Appointment.ends_at > day_start,
        )
    )
    busy = busy_result.scalars().all()

    now = datetime.now(CLINIC_TZ)
    slots: list[datetime] = []
    cursor = day_start
    while cursor + duration <= day_end:
        slot_end = cursor + duration
        is_free = not any(cursor < b.ends_at and slot_end > b.starts_at for b in busy)
        if cursor > now and is_free:
            slots.append(cursor)
        cursor += duration

    return slots

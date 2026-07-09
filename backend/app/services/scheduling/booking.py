import uuid
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.appointment import Appointment, AppointmentStatus
from app.models.service import Service


class SlotUnavailableError(Exception):
    pass


async def _has_conflict(
    db: AsyncSession,
    clinic_id: uuid.UUID,
    staff_id: uuid.UUID,
    starts_at: datetime,
    ends_at: datetime,
    exclude_appointment_id: uuid.UUID | None = None,
) -> bool:
    # Note: this is a check-then-insert, not atomic under concurrent requests.
    # Acceptable for MVP volume; a range-exclusion constraint (btree_gist) would
    # close the race if double-booking becomes an observed problem.
    stmt = select(Appointment).where(
        Appointment.clinic_id == clinic_id,
        Appointment.staff_id == staff_id,
        Appointment.status == AppointmentStatus.SCHEDULED,
        Appointment.starts_at < ends_at,
        Appointment.ends_at > starts_at,
    )
    if exclude_appointment_id is not None:
        stmt = stmt.where(Appointment.id != exclude_appointment_id)

    result = await db.execute(stmt)
    return result.scalars().first() is not None


async def book_appointment(
    db: AsyncSession,
    clinic_id: uuid.UUID,
    patient_id: uuid.UUID,
    staff_id: uuid.UUID,
    service_id: uuid.UUID,
    starts_at: datetime,
) -> Appointment:
    service = await db.get(Service, service_id)
    if service is None or service.clinic_id != clinic_id:
        raise ValueError("Услуга не найдена")

    ends_at = starts_at + timedelta(minutes=service.duration_minutes)

    if await _has_conflict(db, clinic_id, staff_id, starts_at, ends_at):
        raise SlotUnavailableError("Этот слот уже занят")

    appointment = Appointment(
        clinic_id=clinic_id,
        patient_id=patient_id,
        staff_id=staff_id,
        service_id=service_id,
        starts_at=starts_at,
        ends_at=ends_at,
        status=AppointmentStatus.SCHEDULED,
    )
    db.add(appointment)
    await db.commit()
    await db.refresh(appointment)
    return appointment


async def reschedule_appointment(
    db: AsyncSession,
    clinic_id: uuid.UUID,
    appointment_id: uuid.UUID,
    new_starts_at: datetime,
) -> Appointment:
    appointment = await db.get(Appointment, appointment_id)
    if appointment is None or appointment.clinic_id != clinic_id:
        raise ValueError("Запись не найдена")
    if appointment.status != AppointmentStatus.SCHEDULED:
        raise ValueError("Можно переносить только активную запись")

    service = await db.get(Service, appointment.service_id)
    new_ends_at = new_starts_at + timedelta(minutes=service.duration_minutes)

    if await _has_conflict(
        db, clinic_id, appointment.staff_id, new_starts_at, new_ends_at, exclude_appointment_id=appointment.id
    ):
        raise SlotUnavailableError("Этот слот уже занят")

    appointment.starts_at = new_starts_at
    appointment.ends_at = new_ends_at
    await db.commit()
    await db.refresh(appointment)
    return appointment


async def cancel_appointment(
    db: AsyncSession, clinic_id: uuid.UUID, appointment_id: uuid.UUID
) -> Appointment:
    appointment = await db.get(Appointment, appointment_id)
    if appointment is None or appointment.clinic_id != clinic_id:
        raise ValueError("Запись не найдена")

    appointment.status = AppointmentStatus.CANCELLED
    await db.commit()
    await db.refresh(appointment)
    return appointment

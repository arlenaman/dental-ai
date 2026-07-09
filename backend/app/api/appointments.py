import uuid
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_staff
from app.db.session import get_db
from app.models.appointment import Appointment
from app.models.staff import Staff
from app.schemas.appointment import AppointmentCreate, AppointmentOut, RescheduleRequest
from app.services.scheduling import (
    SlotUnavailableError,
    book_appointment,
    cancel_appointment,
    reschedule_appointment,
)
from app.services.scheduling.timezone import CLINIC_TZ

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.post("", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    payload: AppointmentCreate,
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> Appointment:
    try:
        return await book_appointment(
            db,
            current_staff.clinic_id,
            payload.patient_id,
            payload.staff_id,
            payload.service_id,
            payload.starts_at,
        )
    except SlotUnavailableError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.post("/{appointment_id}/reschedule", response_model=AppointmentOut)
async def reschedule(
    appointment_id: uuid.UUID,
    payload: RescheduleRequest,
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> Appointment:
    try:
        return await reschedule_appointment(
            db, current_staff.clinic_id, appointment_id, payload.starts_at
        )
    except SlotUnavailableError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.post("/{appointment_id}/cancel", response_model=AppointmentOut)
async def cancel(
    appointment_id: uuid.UUID,
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> Appointment:
    try:
        return await cancel_appointment(db, current_staff.clinic_id, appointment_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.get("", response_model=list[AppointmentOut])
async def list_appointments(
    on_date: date | None = Query(default=None, alias="date"),
    staff_id: uuid.UUID | None = None,
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> list[Appointment]:
    stmt = select(Appointment).where(Appointment.clinic_id == current_staff.clinic_id)
    if staff_id is not None:
        stmt = stmt.where(Appointment.staff_id == staff_id)
    if on_date is not None:
        day_start = datetime.combine(on_date, datetime.min.time(), tzinfo=CLINIC_TZ)
        day_end = datetime.combine(on_date, datetime.max.time(), tzinfo=CLINIC_TZ)
        stmt = stmt.where(Appointment.starts_at >= day_start, Appointment.starts_at <= day_end)

    result = await db.execute(stmt.order_by(Appointment.starts_at))
    return list(result.scalars().all())

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_staff
from app.db.session import get_db
from app.models.staff import Staff
from app.models.working_hours import WorkingHours
from app.schemas.working_hours import WorkingHoursCreate, WorkingHoursOut

router = APIRouter(prefix="/working-hours", tags=["working-hours"])


@router.get("", response_model=list[WorkingHoursOut])
async def list_working_hours(
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> list[WorkingHours]:
    result = await db.execute(
        select(WorkingHours)
        .where(WorkingHours.clinic_id == current_staff.clinic_id)
        .order_by(WorkingHours.weekday, WorkingHours.start_time)
    )
    return list(result.scalars().all())


@router.post("", response_model=WorkingHoursOut, status_code=status.HTTP_201_CREATED)
async def create_working_hours(
    payload: WorkingHoursCreate,
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> WorkingHours:
    if payload.staff_id is not None:
        staff = await db.get(Staff, payload.staff_id)
        if staff is None or staff.clinic_id != current_staff.clinic_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Сотрудник не найден")

    if payload.start_time >= payload.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Время начала должно быть раньше времени окончания",
        )

    entry = WorkingHours(clinic_id=current_staff.clinic_id, **payload.model_dump())
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_working_hours(
    entry_id: uuid.UUID,
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> None:
    entry = await db.get(WorkingHours, entry_id)
    if entry is None or entry.clinic_id != current_staff.clinic_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Запись не найдена")

    await db.delete(entry)
    await db.commit()

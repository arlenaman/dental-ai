import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_staff
from app.db.session import get_db
from app.models.clinic_faq_entry import ClinicFaqEntry
from app.models.staff import Staff
from app.schemas.faq import FaqEntryCreate, FaqEntryOut, FaqEntryUpdate

router = APIRouter(prefix="/faq", tags=["faq"])


@router.get("", response_model=list[FaqEntryOut])
async def list_faq_entries(
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> list[ClinicFaqEntry]:
    result = await db.execute(
        select(ClinicFaqEntry)
        .where(ClinicFaqEntry.clinic_id == current_staff.clinic_id)
        .order_by(ClinicFaqEntry.created_at.desc())
    )
    return list(result.scalars().all())


@router.post("", response_model=FaqEntryOut, status_code=status.HTTP_201_CREATED)
async def create_faq_entry(
    payload: FaqEntryCreate,
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> ClinicFaqEntry:
    entry = ClinicFaqEntry(clinic_id=current_staff.clinic_id, **payload.model_dump())
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.patch("/{entry_id}", response_model=FaqEntryOut)
async def update_faq_entry(
    entry_id: uuid.UUID,
    payload: FaqEntryUpdate,
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> ClinicFaqEntry:
    entry = await db.get(ClinicFaqEntry, entry_id)
    if entry is None or entry.clinic_id != current_staff.clinic_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Запись не найдена")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)

    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_faq_entry(
    entry_id: uuid.UUID,
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> None:
    entry = await db.get(ClinicFaqEntry, entry_id)
    if entry is None or entry.clinic_id != current_staff.clinic_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Запись не найдена")

    await db.delete(entry)
    await db.commit()

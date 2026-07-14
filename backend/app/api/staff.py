import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_staff, require_admin
from app.core.security import hash_password
from app.db.session import get_db
from app.models.staff import Staff
from app.schemas.auth import StaffCreate, StaffOut, StaffUpdate

router = APIRouter(prefix="/staff", tags=["staff"])


@router.get("", response_model=list[StaffOut])
async def list_staff(
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> list[Staff]:
    result = await db.execute(
        select(Staff)
        .where(Staff.clinic_id == current_staff.clinic_id)
        .order_by(Staff.full_name)
    )
    return list(result.scalars().all())


@router.post("", response_model=StaffOut, status_code=status.HTTP_201_CREATED)
async def create_staff(
    payload: StaffCreate,
    current_staff: Staff = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Staff:
    existing = await db.execute(select(Staff).where(Staff.email == payload.email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email уже используется")

    staff = Staff(
        clinic_id=current_staff.clinic_id,
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(staff)
    await db.commit()
    await db.refresh(staff)
    return staff


@router.patch("/{staff_id}", response_model=StaffOut)
async def update_staff(
    staff_id: uuid.UUID,
    payload: StaffUpdate,
    current_staff: Staff = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Staff:
    staff = await db.get(Staff, staff_id)
    if staff is None or staff.clinic_id != current_staff.clinic_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Сотрудник не найден")

    if staff.id == current_staff.id and payload.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Нельзя деактивировать самого себя"
        )

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(staff, field, value)

    await db.commit()
    await db.refresh(staff)
    return staff

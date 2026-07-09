from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_staff
from app.db.session import get_db
from app.models.staff import Staff
from app.schemas.auth import StaffOut

router = APIRouter(prefix="/staff", tags=["staff"])


@router.get("", response_model=list[StaffOut])
async def list_staff(
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> list[Staff]:
    result = await db.execute(
        select(Staff)
        .where(Staff.clinic_id == current_staff.clinic_id, Staff.is_active.is_(True))
        .order_by(Staff.full_name)
    )
    return list(result.scalars().all())

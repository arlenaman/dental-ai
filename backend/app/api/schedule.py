import uuid
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_staff
from app.db.session import get_db
from app.models.staff import Staff
from app.services.scheduling import get_available_slots

router = APIRouter(prefix="/schedule", tags=["schedule"])


@router.get("/slots", response_model=list[datetime])
async def slots(
    staff_id: uuid.UUID,
    service_id: uuid.UUID,
    on_date: date = Query(alias="date"),
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> list[datetime]:
    try:
        return await get_available_slots(
            db, current_staff.clinic_id, staff_id, service_id, on_date
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

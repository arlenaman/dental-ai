import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_staff
from app.db.session import get_db
from app.models.service import Service
from app.models.staff import Staff
from app.schemas.service import ServiceCreate, ServiceOut, ServiceUpdate

router = APIRouter(prefix="/services", tags=["services"])


@router.get("", response_model=list[ServiceOut])
async def list_services(
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> list[Service]:
    result = await db.execute(
        select(Service)
        .where(Service.clinic_id == current_staff.clinic_id)
        .order_by(Service.name)
    )
    return list(result.scalars().all())


@router.post("", response_model=ServiceOut, status_code=status.HTTP_201_CREATED)
async def create_service(
    payload: ServiceCreate,
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> Service:
    service = Service(clinic_id=current_staff.clinic_id, **payload.model_dump())
    db.add(service)
    await db.commit()
    await db.refresh(service)
    return service


@router.patch("/{service_id}", response_model=ServiceOut)
async def update_service(
    service_id: uuid.UUID,
    payload: ServiceUpdate,
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> Service:
    service = await db.get(Service, service_id)
    if service is None or service.clinic_id != current_staff.clinic_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Услуга не найдена")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(service, field, value)

    await db.commit()
    await db.refresh(service)
    return service

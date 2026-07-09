from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.db.session import get_db
from app.models.clinic import Clinic
from app.models.staff import Staff, StaffRole
from app.schemas.clinic import ClinicOut, ClinicSignupRequest

router = APIRouter(prefix="/clinics", tags=["clinics"])


@router.post("", response_model=ClinicOut, status_code=status.HTTP_201_CREATED)
async def signup_clinic(
    payload: ClinicSignupRequest, db: AsyncSession = Depends(get_db)
) -> Clinic:
    existing_slug = await db.execute(select(Clinic).where(Clinic.slug == payload.clinic_slug))
    if existing_slug.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug уже занят")

    existing_email = await db.execute(select(Staff).where(Staff.email == payload.owner_email))
    if existing_email.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email уже используется")

    clinic = Clinic(name=payload.clinic_name, slug=payload.clinic_slug)
    db.add(clinic)
    await db.flush()

    owner = Staff(
        clinic_id=clinic.id,
        full_name=payload.owner_full_name,
        email=payload.owner_email,
        hashed_password=hash_password(payload.owner_password),
        role=StaffRole.OWNER,
    )
    db.add(owner)

    await db.commit()
    await db.refresh(clinic)
    return clinic

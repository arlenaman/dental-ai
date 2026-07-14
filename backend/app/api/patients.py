import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_staff
from app.db.session import get_db
from app.models.patient import Patient
from app.models.staff import Staff
from app.schemas.patient import PatientCreate, PatientOut
from app.services.patients import find_or_create_patient as find_or_create_patient_service

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("", response_model=list[PatientOut])
async def list_patients(
    search: str | None = Query(default=None),
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> list[Patient]:
    stmt = select(Patient).where(Patient.clinic_id == current_staff.clinic_id)
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(or_(Patient.full_name.ilike(pattern), Patient.phone.ilike(pattern)))
    stmt = stmt.order_by(Patient.full_name).limit(200)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post("", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
async def find_or_create_patient(
    payload: PatientCreate,
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> Patient:
    patient = await find_or_create_patient_service(
        db,
        current_staff.clinic_id,
        payload.phone,
        full_name=payload.full_name,
        preferred_language=payload.preferred_language,
    )
    await db.commit()
    await db.refresh(patient)
    return patient


@router.get("/{patient_id}", response_model=PatientOut)
async def get_patient(
    patient_id: uuid.UUID,
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> Patient:
    patient = await db.get(Patient, patient_id)
    if patient is None or patient.clinic_id != current_staff.clinic_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пациент не найден")
    return patient

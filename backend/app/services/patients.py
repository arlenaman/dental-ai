import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patient import Patient


async def find_or_create_patient(
    db: AsyncSession,
    clinic_id: uuid.UUID,
    phone: str,
    full_name: str | None = None,
    preferred_language: str = "ru",
) -> Patient:
    result = await db.execute(
        select(Patient).where(Patient.clinic_id == clinic_id, Patient.phone == phone)
    )
    patient = result.scalar_one_or_none()
    if patient is not None:
        return patient

    patient = Patient(
        clinic_id=clinic_id,
        full_name=full_name or phone,
        phone=phone,
        preferred_language=preferred_language,
    )
    db.add(patient)
    await db.flush()
    return patient

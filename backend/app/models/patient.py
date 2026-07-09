from sqlalchemy import String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin, TimestampMixin, UUIDPrimaryKeyMixin


class Patient(UUIDPrimaryKeyMixin, TenantMixin, TimestampMixin, Base):
    """A clinic's patient, identified within the clinic by phone number."""

    __tablename__ = "patients"
    __table_args__ = (UniqueConstraint("clinic_id", "phone", name="uq_patient_clinic_phone"),)

    full_name: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(32), index=True)
    preferred_language: Mapped[str] = mapped_column(String(2), default="ru")  # "ru" | "kk"

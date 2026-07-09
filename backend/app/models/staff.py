import enum

from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin, TimestampMixin, UUIDPrimaryKeyMixin


class StaffRole(str, enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    DENTIST = "dentist"


class Staff(UUIDPrimaryKeyMixin, TenantMixin, TimestampMixin, Base):
    """A clinic employee with access to the admin panel."""

    __tablename__ = "staff"

    full_name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[StaffRole] = mapped_column(
        Enum(StaffRole, native_enum=False, length=20), default=StaffRole.DENTIST
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

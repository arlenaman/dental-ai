from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Clinic(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A tenant: one dental clinic using the SaaS product."""

    __tablename__ = "clinics"

    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    is_active: Mapped[bool] = mapped_column(default=True)

from sqlalchemy import Boolean, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin, TimestampMixin, UUIDPrimaryKeyMixin


class Service(UUIDPrimaryKeyMixin, TenantMixin, TimestampMixin, Base):
    """A billable dental service offered by a clinic (e.g. осмотр, чистка)."""

    __tablename__ = "services"

    name: Mapped[str] = mapped_column(String(255))
    duration_minutes: Mapped[int] = mapped_column(Integer)
    price_amount: Mapped[float] = mapped_column(Numeric(10, 2))
    price_currency: Mapped[str] = mapped_column(String(3), default="KZT")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

import uuid
from datetime import time

from sqlalchemy import ForeignKey, Integer, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin, TimestampMixin, UUIDPrimaryKeyMixin


class WorkingHours(UUIDPrimaryKeyMixin, TenantMixin, TimestampMixin, Base):
    """Recurring weekly availability template.

    If staff_id is null, the row defines the clinic's default hours for that
    weekday; a non-null staff_id overrides it for that specific dentist.
    Used by the scheduling module (stage 3) to compute bookable slots.
    """

    __tablename__ = "working_hours"

    staff_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("staff.id", ondelete="CASCADE"), nullable=True
    )
    weekday: Mapped[int] = mapped_column(Integer)  # 0 = Monday ... 6 = Sunday
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)

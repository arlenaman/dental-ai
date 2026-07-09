import enum
import uuid

from sqlalchemy import Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin, TimestampMixin, UUIDPrimaryKeyMixin


class MessageDirection(str, enum.Enum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"


class Message(UUIDPrimaryKeyMixin, TenantMixin, TimestampMixin, Base):
    __tablename__ = "messages"
    __table_args__ = (
        UniqueConstraint(
            "clinic_id", "provider_message_id", name="uq_message_clinic_provider_id"
        ),
    )

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("conversations.id"), index=True
    )
    direction: Mapped[MessageDirection] = mapped_column(
        Enum(MessageDirection, native_enum=False, length=10)
    )
    body: Mapped[str] = mapped_column(String(4096))
    # WhatsApp message id (wamid...); nullable because not every future channel/direction
    # is guaranteed to have one at insert time. Used for webhook-retry idempotency.
    provider_message_id: Mapped[str | None] = mapped_column(
        String(128), nullable=True, index=True
    )

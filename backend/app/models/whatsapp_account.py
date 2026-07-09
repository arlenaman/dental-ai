from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin, TimestampMixin, UUIDPrimaryKeyMixin


class WhatsAppAccount(UUIDPrimaryKeyMixin, TenantMixin, TimestampMixin, Base):
    """A clinic's connected WhatsApp Business number (via Meta Cloud API or a BSP)."""

    __tablename__ = "whatsapp_accounts"

    phone_number_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    display_phone_number: Mapped[str] = mapped_column(String(32))
    access_token: Mapped[str] = mapped_column(String(1024))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

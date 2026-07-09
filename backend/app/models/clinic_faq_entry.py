from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin, TimestampMixin, UUIDPrimaryKeyMixin


class ClinicFaqEntry(UUIDPrimaryKeyMixin, TenantMixin, TimestampMixin, Base):
    """A clinic-authored FAQ entry the AI agent can search and cite from.

    MVP knowledge base uses Postgres full-text search (language-agnostic
    "simple" config, since content mixes Russian and Kazakh). pgvector is
    already provisioned on the DB for a future semantic-search upgrade.
    """

    __tablename__ = "clinic_faq_entries"

    question: Mapped[str] = mapped_column(String(500))
    answer: Mapped[str] = mapped_column(String(4000))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

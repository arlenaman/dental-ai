import uuid
from decimal import Decimal

from pydantic import BaseModel, Field


class ServiceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    duration_minutes: int = Field(gt=0, le=480)
    price_amount: Decimal = Field(gt=0)
    price_currency: str = Field(default="KZT", min_length=3, max_length=3)


class ServiceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    duration_minutes: int | None = Field(default=None, gt=0, le=480)
    price_amount: Decimal | None = Field(default=None, gt=0)
    price_currency: str | None = Field(default=None, min_length=3, max_length=3)
    is_active: bool | None = None


class ServiceOut(BaseModel):
    id: uuid.UUID
    name: str
    duration_minutes: int
    price_amount: Decimal
    price_currency: str
    is_active: bool

    model_config = {"from_attributes": True}

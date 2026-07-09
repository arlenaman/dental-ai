import uuid

from pydantic import BaseModel, Field


class WhatsAppAccountCreate(BaseModel):
    phone_number_id: str = Field(min_length=1, max_length=64)
    display_phone_number: str = Field(min_length=1, max_length=32)
    access_token: str = Field(min_length=1, max_length=1024)


class WhatsAppAccountOut(BaseModel):
    id: uuid.UUID
    phone_number_id: str
    display_phone_number: str
    is_active: bool

    model_config = {"from_attributes": True}

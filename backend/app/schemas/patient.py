import uuid

from pydantic import BaseModel, Field


class PatientCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=5, max_length=32)
    preferred_language: str = Field(default="ru", pattern="^(ru|kk)$")


class PatientOut(BaseModel):
    id: uuid.UUID
    full_name: str
    phone: str
    preferred_language: str

    model_config = {"from_attributes": True}

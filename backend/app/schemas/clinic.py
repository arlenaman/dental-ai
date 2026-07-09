import uuid

from pydantic import BaseModel, EmailStr, Field


class ClinicSignupRequest(BaseModel):
    clinic_name: str = Field(min_length=1, max_length=255)
    clinic_slug: str = Field(min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    owner_full_name: str = Field(min_length=1, max_length=255)
    owner_email: EmailStr
    owner_password: str = Field(min_length=8, max_length=72)


class ClinicOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    is_active: bool

    model_config = {"from_attributes": True}

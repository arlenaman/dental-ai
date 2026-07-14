import uuid

from pydantic import BaseModel, EmailStr, Field

from app.models.staff import StaffRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class StaffOut(BaseModel):
    id: uuid.UUID
    clinic_id: uuid.UUID
    full_name: str
    email: EmailStr
    role: StaffRole
    is_active: bool

    model_config = {"from_attributes": True}


class StaffCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    role: StaffRole = StaffRole.DENTIST


class StaffUpdate(BaseModel):
    role: StaffRole | None = None
    is_active: bool | None = None

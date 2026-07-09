import uuid

from pydantic import BaseModel, EmailStr

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

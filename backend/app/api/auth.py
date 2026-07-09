from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_staff
from app.core.security import create_access_token, verify_password
from app.db.session import get_db
from app.models.staff import Staff
from app.schemas.auth import LoginRequest, StaffOut, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    result = await db.execute(select(Staff).where(Staff.email == payload.email))
    staff = result.scalar_one_or_none()

    if staff is None or not staff.is_active or not verify_password(payload.password, staff.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный email или пароль"
        )

    token = create_access_token(staff_id=staff.id, clinic_id=staff.clinic_id)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=StaffOut)
async def me(current_staff: Staff = Depends(get_current_staff)) -> Staff:
    return current_staff

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_staff
from app.db.session import get_db
from app.models.staff import Staff
from app.models.whatsapp_account import WhatsAppAccount
from app.schemas.whatsapp_account import WhatsAppAccountCreate, WhatsAppAccountOut

router = APIRouter(prefix="/whatsapp/accounts", tags=["whatsapp"])


@router.post("", response_model=WhatsAppAccountOut, status_code=status.HTTP_201_CREATED)
async def connect_account(
    payload: WhatsAppAccountCreate,
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> WhatsAppAccount:
    existing = await db.execute(
        select(WhatsAppAccount).where(
            WhatsAppAccount.phone_number_id == payload.phone_number_id
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Этот номер уже подключён"
        )

    account = WhatsAppAccount(
        clinic_id=current_staff.clinic_id,
        phone_number_id=payload.phone_number_id,
        display_phone_number=payload.display_phone_number,
        access_token=payload.access_token,
    )
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return account


@router.get("", response_model=list[WhatsAppAccountOut])
async def list_accounts(
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> list[WhatsAppAccount]:
    result = await db.execute(
        select(WhatsAppAccount).where(WhatsAppAccount.clinic_id == current_staff.clinic_id)
    )
    return list(result.scalars().all())

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_staff
from app.db.session import get_db
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.patient import Patient
from app.models.staff import Staff
from app.schemas.conversation import ConversationOut, MessageOut

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("", response_model=list[ConversationOut])
async def list_conversations(
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> list[ConversationOut]:
    latest_message = (
        select(Message.conversation_id, Message.body)
        .distinct(Message.conversation_id)
        .order_by(Message.conversation_id, Message.created_at.desc())
        .subquery()
    )

    stmt = (
        select(Conversation, Patient.full_name, Patient.phone, latest_message.c.body)
        .join(Patient, Patient.id == Conversation.patient_id)
        .outerjoin(latest_message, latest_message.c.conversation_id == Conversation.id)
        .where(Conversation.clinic_id == current_staff.clinic_id)
        .order_by(Conversation.last_message_at.desc().nulls_last())
    )
    rows = (await db.execute(stmt)).all()

    return [
        ConversationOut(
            id=conversation.id,
            patient_id=conversation.patient_id,
            patient_name=patient_name,
            patient_phone=patient_phone,
            status=conversation.status,
            last_message_at=conversation.last_message_at,
            last_message_preview=preview,
        )
        for conversation, patient_name, patient_phone, preview in rows
    ]


@router.get("/{conversation_id}/messages", response_model=list[MessageOut])
async def list_conversation_messages(
    conversation_id: uuid.UUID,
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> list[Message]:
    conversation = await db.get(Conversation, conversation_id)
    if conversation is None or conversation.clinic_id != current_staff.clinic_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Диалог не найден")

    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )
    return list(result.scalars().all())

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation, ConversationStatus


async def find_or_create_open_conversation(
    db: AsyncSession, clinic_id: uuid.UUID, patient_id: uuid.UUID
) -> Conversation:
    result = await db.execute(
        select(Conversation)
        .where(
            Conversation.clinic_id == clinic_id,
            Conversation.patient_id == patient_id,
            Conversation.status == ConversationStatus.OPEN,
        )
        .order_by(Conversation.created_at.desc())
    )
    conversation = result.scalars().first()
    if conversation is not None:
        return conversation

    conversation = Conversation(clinic_id=clinic_id, patient_id=patient_id)
    db.add(conversation)
    await db.flush()
    return conversation

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.message import Message, MessageDirection
from app.models.whatsapp_account import WhatsAppAccount
from app.services.whatsapp.client import WhatsAppClient


async def send_and_log_message(
    db: AsyncSession, clinic_id: uuid.UUID, conversation_id: uuid.UUID, to: str, body: str
) -> Message:
    result = await db.execute(
        select(WhatsAppAccount).where(
            WhatsAppAccount.clinic_id == clinic_id, WhatsAppAccount.is_active.is_(True)
        )
    )
    account = result.scalars().first()
    if account is None:
        raise ValueError("У клиники не подключён WhatsApp")

    client = WhatsAppClient(
        account.phone_number_id, account.access_token, settings.whatsapp_api_base_url
    )
    response = await client.send_text_message(to, body)
    provider_message_id = response.get("messages", [{}])[0].get("id")

    message = Message(
        clinic_id=clinic_id,
        conversation_id=conversation_id,
        direction=MessageDirection.OUTBOUND,
        body=body,
        provider_message_id=provider_message_id,
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message

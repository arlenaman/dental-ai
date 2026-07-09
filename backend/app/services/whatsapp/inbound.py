from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message, MessageDirection
from app.models.whatsapp_account import WhatsAppAccount
from app.services.patients import find_or_create_patient
from app.services.whatsapp.conversations import find_or_create_open_conversation


async def _get_account_by_phone_number_id(
    db: AsyncSession, phone_number_id: str
) -> WhatsAppAccount | None:
    result = await db.execute(
        select(WhatsAppAccount).where(
            WhatsAppAccount.phone_number_id == phone_number_id,
            WhatsAppAccount.is_active.is_(True),
        )
    )
    return result.scalar_one_or_none()


async def process_webhook_payload(db: AsyncSession, payload: dict) -> list[Message]:
    """Parse a Meta Cloud API webhook payload and persist inbound text messages.

    Non-text messages (images, statuses/delivery receipts, etc.) and messages
    from unregistered phone_number_ids are silently skipped rather than
    erroring, per Meta's webhook contract (always return 200 quickly).
    """
    created_messages: list[Message] = []

    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            phone_number_id = value.get("metadata", {}).get("phone_number_id")
            if not phone_number_id:
                continue

            account = await _get_account_by_phone_number_id(db, phone_number_id)
            if account is None:
                continue

            contacts = {
                c["wa_id"]: c.get("profile", {}).get("name")
                for c in value.get("contacts", [])
                if "wa_id" in c
            }

            for raw_message in value.get("messages", []):
                if raw_message.get("type") != "text":
                    continue

                provider_message_id = raw_message["id"]
                existing = await db.execute(
                    select(Message).where(
                        Message.clinic_id == account.clinic_id,
                        Message.provider_message_id == provider_message_id,
                    )
                )
                if existing.scalar_one_or_none() is not None:
                    continue

                wa_id = raw_message["from"]
                patient = await find_or_create_patient(
                    db, account.clinic_id, wa_id, full_name=contacts.get(wa_id)
                )
                conversation = await find_or_create_open_conversation(
                    db, account.clinic_id, patient.id
                )

                message = Message(
                    clinic_id=account.clinic_id,
                    conversation_id=conversation.id,
                    direction=MessageDirection.INBOUND,
                    body=raw_message.get("text", {}).get("body", ""),
                    provider_message_id=provider_message_id,
                )
                db.add(message)
                conversation.last_message_at = datetime.now(timezone.utc)
                created_messages.append(message)

    await db.commit()
    return created_messages

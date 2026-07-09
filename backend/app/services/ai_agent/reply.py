import logging
import uuid

from app.db.session import async_session_factory
from app.models.patient import Patient
from app.services.ai_agent.agent import generate_reply
from app.services.whatsapp.outbound import send_and_log_message

logger = logging.getLogger(__name__)


async def generate_and_send_reply(
    clinic_id: uuid.UUID, conversation_id: uuid.UUID, patient_id: uuid.UUID
) -> None:
    """Runs as a FastAPI background task, after the webhook has already
    returned 200 to Meta — Claude's tool-calling loop can take longer than
    Meta's webhook response window allows.
    """
    async with async_session_factory() as db:
        try:
            patient = await db.get(Patient, patient_id)
            if patient is None:
                return

            reply_text = await generate_reply(db, clinic_id, patient, conversation_id)
            await send_and_log_message(db, clinic_id, conversation_id, patient.phone, reply_text)
        except Exception:
            logger.exception(
                "Failed to generate/send AI reply for conversation %s", conversation_id
            )

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.conversation import ConversationStatus
from app.models.message import MessageDirection


class ConversationOut(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    patient_name: str
    patient_phone: str
    status: ConversationStatus
    last_message_at: datetime | None
    last_message_preview: str | None

    model_config = {"from_attributes": True}


class MessageOut(BaseModel):
    id: uuid.UUID
    direction: MessageDirection
    body: str
    created_at: datetime

    model_config = {"from_attributes": True}

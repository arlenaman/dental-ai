import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.appointment import AppointmentStatus


class AppointmentCreate(BaseModel):
    patient_id: uuid.UUID
    staff_id: uuid.UUID
    service_id: uuid.UUID
    starts_at: datetime


class RescheduleRequest(BaseModel):
    starts_at: datetime


class AppointmentOut(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    staff_id: uuid.UUID
    service_id: uuid.UUID
    starts_at: datetime
    ends_at: datetime
    status: AppointmentStatus

    model_config = {"from_attributes": True}

import uuid
from datetime import time

from pydantic import BaseModel, Field


class WorkingHoursCreate(BaseModel):
    staff_id: uuid.UUID | None = Field(
        default=None, description="null = общее расписание клиники по умолчанию"
    )
    weekday: int = Field(ge=0, le=6, description="0 = понедельник ... 6 = воскресенье")
    start_time: time
    end_time: time


class WorkingHoursOut(BaseModel):
    id: uuid.UUID
    staff_id: uuid.UUID | None
    weekday: int
    start_time: time
    end_time: time

    model_config = {"from_attributes": True}

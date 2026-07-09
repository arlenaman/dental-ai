import uuid

from pydantic import BaseModel, Field


class FaqEntryCreate(BaseModel):
    question: str = Field(min_length=1, max_length=500)
    answer: str = Field(min_length=1, max_length=4000)


class FaqEntryUpdate(BaseModel):
    question: str | None = Field(default=None, min_length=1, max_length=500)
    answer: str | None = Field(default=None, min_length=1, max_length=4000)
    is_active: bool | None = None


class FaqEntryOut(BaseModel):
    id: uuid.UUID
    question: str
    answer: str
    is_active: bool

    model_config = {"from_attributes": True}

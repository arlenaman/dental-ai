import uuid

from anthropic import AsyncAnthropic
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.clinic import Clinic
from app.models.message import Message
from app.models.patient import Patient
from app.services.ai_agent.history import to_claude_messages
from app.services.ai_agent.tools import build_tools

SYSTEM_PROMPT_TEMPLATE = """Ты — виртуальный ассистент стоматологической клиники «{clinic_name}» в WhatsApp.

Твоя задача:
- помогать пациентам записываться на приём, переносить или отменять запись;
- отвечать на вопросы о клинике (часы работы, цены, услуги, подготовка к визиту) — используй \
search_clinic_faq и list_services, никогда не выдумывай факты;
- вести себя дружелюбно и по-деловому, как хороший администратор клиники.

Язык:
- Определяй язык последнего сообщения пациента и отвечай на нём же.
- Пациенты этой клиники в основном пишут по-русски — если не уверен в языке, отвечай по-русски.
- Казахский язык поддерживается как вторичный сценарий: если пациент пишет по-казахски, отвечай \
по-казахски.

Правила:
- Никогда не придумывай услуги, цены, врачей или свободные слоты — всегда проверяй через инструменты.
- Не давай медицинских консультаций и диагнозов. По медицинским вопросам направляй пациента на очный \
приём к врачу.
- Перед бронированием предложи пациенту доступные варианты и дождись, какой из них он выберет.
- Ответ — обычный текст для мессенджера: без markdown-заголовков и сложной разметки, короткие абзацы.
- Если не можешь помочь (например, экстренная ситуация) — предложи связаться с клиникой напрямую по \
телефону.
"""


async def generate_reply(
    db: AsyncSession, clinic_id: uuid.UUID, patient: Patient, conversation_id: uuid.UUID
) -> str:
    clinic = await db.get(Clinic, clinic_id)

    history_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )
    messages = to_claude_messages(list(history_result.scalars().all()))

    tools = build_tools(db, clinic_id, patient.id)
    system = SYSTEM_PROMPT_TEMPLATE.format(clinic_name=clinic.name)

    client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    runner = client.beta.messages.tool_runner(
        model=settings.anthropic_model,
        max_tokens=2048,
        system=system,
        tools=tools,
        messages=messages,
    )

    final_text = ""
    async for message in runner:
        for block in message.content:
            if block.type == "text":
                final_text = block.text

    return final_text or (
        "Извините, не получилось сформировать ответ. Пожалуйста, попробуйте ещё раз "
        "или свяжитесь с клиникой напрямую."
    )

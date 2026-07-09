import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.clinic_faq_entry import ClinicFaqEntry


async def search_faq(
    db: AsyncSession, clinic_id: uuid.UUID, query: str, limit: int = 3
) -> list[ClinicFaqEntry]:
    tsvector = func.to_tsvector("simple", ClinicFaqEntry.question + " " + ClinicFaqEntry.answer)
    tsquery = func.plainto_tsquery("simple", query)

    stmt = (
        select(ClinicFaqEntry)
        .where(
            ClinicFaqEntry.clinic_id == clinic_id,
            ClinicFaqEntry.is_active.is_(True),
            tsvector.op("@@")(tsquery),
        )
        .order_by(func.ts_rank(tsvector, tsquery).desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())

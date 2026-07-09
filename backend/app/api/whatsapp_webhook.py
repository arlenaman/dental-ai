import json

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.services.ai_agent.reply import generate_and_send_reply
from app.services.whatsapp.inbound import process_webhook_payload
from app.services.whatsapp.security import verify_signature

router = APIRouter(prefix="/webhooks/whatsapp", tags=["whatsapp"])


@router.get("")
async def verify_webhook(
    hub_mode: str = Query(alias="hub.mode"),
    hub_verify_token: str = Query(alias="hub.verify_token"),
    hub_challenge: str = Query(alias="hub.challenge"),
) -> Response:
    if hub_mode != "subscribe" or hub_verify_token != settings.whatsapp_webhook_verify_token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verification failed")
    return Response(content=hub_challenge, media_type="text/plain")


@router.post("")
async def receive_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> dict:
    raw_body = await request.body()
    signature = request.headers.get("X-Hub-Signature-256")

    if not verify_signature(settings.whatsapp_app_secret, raw_body, signature):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid signature")

    payload = json.loads(raw_body)
    new_messages = await process_webhook_payload(db, payload)

    for result in new_messages:
        background_tasks.add_task(
            generate_and_send_reply, result.clinic_id, result.conversation_id, result.patient_id
        )

    # Meta requires a fast 200 OK regardless of processing outcome, or it will
    # retry aggressively and eventually disable the webhook subscription. The
    # AI reply runs as a background task, after this response is sent.
    return {"status": "ok"}

from fastapi import FastAPI

from app.api.appointments import router as appointments_router
from app.api.auth import router as auth_router
from app.api.clinics import router as clinics_router
from app.api.health import router as health_router
from app.api.patients import router as patients_router
from app.api.schedule import router as schedule_router
from app.api.whatsapp_accounts import router as whatsapp_accounts_router
from app.api.whatsapp_webhook import router as whatsapp_webhook_router

app = FastAPI(title="Dental AI Backend")

app.include_router(health_router)
app.include_router(clinics_router)
app.include_router(auth_router)
app.include_router(patients_router)
app.include_router(schedule_router)
app.include_router(appointments_router)
app.include_router(whatsapp_accounts_router)
app.include_router(whatsapp_webhook_router)

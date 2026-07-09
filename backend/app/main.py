from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.appointments import router as appointments_router
from app.api.auth import router as auth_router
from app.api.clinics import router as clinics_router
from app.api.conversations import router as conversations_router
from app.api.faq import router as faq_router
from app.api.health import router as health_router
from app.api.patients import router as patients_router
from app.api.schedule import router as schedule_router
from app.api.services import router as services_router
from app.api.staff import router as staff_router
from app.api.whatsapp_accounts import router as whatsapp_accounts_router
from app.api.whatsapp_webhook import router as whatsapp_webhook_router
from app.api.working_hours import router as working_hours_router

app = FastAPI(title="Dental AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(clinics_router)
app.include_router(auth_router)
app.include_router(patients_router)
app.include_router(schedule_router)
app.include_router(appointments_router)
app.include_router(whatsapp_accounts_router)
app.include_router(whatsapp_webhook_router)
app.include_router(services_router)
app.include_router(working_hours_router)
app.include_router(faq_router)
app.include_router(conversations_router)
app.include_router(staff_router)

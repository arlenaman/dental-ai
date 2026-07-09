from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.api.clinics import router as clinics_router
from app.api.health import router as health_router

app = FastAPI(title="Dental AI Backend")

app.include_router(health_router)
app.include_router(clinics_router)
app.include_router(auth_router)

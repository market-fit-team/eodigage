from __future__ import annotations

from fastapi import FastAPI

from app.api.routes import router
from app.core.config import settings

app = FastAPI(
    title=settings.service_name,
    version=settings.service_version,
    description="Multi-model service for market trend forecasting.",
)
app.include_router(router)


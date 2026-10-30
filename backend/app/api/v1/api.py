from fastapi import APIRouter
from app.api.v1 import (
    health,
    auth,
    profiles,
    skills,
    opportunities,
    recommendations,
    applications,
    saved,
    learning,
    assistant,
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["Profiles"])
api_router.include_router(skills.router, prefix="/skills", tags=["Skills"])
api_router.include_router(opportunities.router, prefix="/opportunities", tags=["Opportunities"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])
api_router.include_router(applications.router, prefix="/applications", tags=["Applications"])
api_router.include_router(saved.router, prefix="/saved", tags=["Saved"])
api_router.include_router(learning.router, prefix="/learning", tags=["Learning & Roadmap"])
api_router.include_router(assistant.router, prefix="/assistant", tags=["Gemini AI Assistant"])

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_user, AuthenticatedUser
from app.core.database import get_supabase_client
from app.services.skill_gap_engine import skill_gap_engine
from app.schemas.learning import SkillRoadmapResponseSchema, LearningResourceSchema

router = APIRouter()


@router.get("/roadmap", response_model=SkillRoadmapResponseSchema, summary="Get personalized skill roadmap and learning resources")
async def get_roadmap(user: AuthenticatedUser = Depends(get_current_user)):
    return skill_gap_engine.generate_roadmap(user.id, token=user.token)


@router.get("/resources", response_model=List[LearningResourceSchema], summary="Get verified learning resources catalog")
async def get_learning_resources(
    skill: Optional[str] = Query(None, description="Filter by skill name")
):
    supabase = get_supabase_client()
    builder = supabase.table("learning_resources").select("*").order("created_at")
    if skill:
        builder = builder.ilike("skill_name", f"%{skill}%")
    res = builder.execute()
    return res.data or []

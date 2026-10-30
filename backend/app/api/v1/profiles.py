from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user, AuthenticatedUser
from app.core.database import get_supabase_client
from app.core.local_db import get_user_profile, upsert_user_profile
from app.schemas.profile import ProfileCreateUpdateSchema, ProfileResponseSchema
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/me", response_model=ProfileResponseSchema, summary="Get current student profile")
async def get_my_profile(user: AuthenticatedUser = Depends(get_current_user)):
    # 1. Check local database
    local_p = get_user_profile(user.id)
    if local_p:
        return local_p

    # 2. Check Supabase
    try:
        supabase = get_supabase_client(user.token)
        res = supabase.table("profiles").select("*").eq("id", user.id).single().execute()
        if res.data:
            profile_data = res.data
            skills_res = supabase.table("profile_skills").select(
                "proficiency, is_learning_goal, skills(id, name, category)"
            ).eq("profile_id", user.id).execute()

            skills = []
            for item in (skills_res.data or []):
                sk = item.get("skills") or {}
                if sk.get("name"):
                    skills.append({
                        "id": sk.get("id"),
                        "name": sk.get("name"),
                        "category": sk.get("category"),
                        "proficiency": item.get("proficiency", "beginner"),
                        "is_learning_goal": item.get("is_learning_goal", False),
                    })
            profile_data["skills"] = skills
            # Cache locally
            upsert_user_profile(user.id, profile_data)
            return profile_data
    except Exception as e:
        logger.debug(f"Supabase profile load note: {e}")

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Profile not found. Please complete onboarding."
    )


@router.get("/{user_id}", response_model=ProfileResponseSchema, summary="Get profile by ID")
async def get_profile_by_id(user_id: str, current_user: AuthenticatedUser = Depends(get_current_user)):
    local_p = get_user_profile(user_id)
    if local_p:
        return local_p
    try:
        supabase = get_supabase_client(current_user.token)
        res = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
        if res.data:
            profile_data = res.data
            skills_res = supabase.table("profile_skills").select(
                "proficiency, is_learning_goal, skills(id, name, category)"
            ).eq("profile_id", user_id).execute()
            skills = []
            for item in (skills_res.data or []):
                sk = item.get("skills") or {}
                if sk.get("name"):
                    skills.append({
                        "id": sk.get("id"),
                        "name": sk.get("name"),
                        "category": sk.get("category"),
                        "proficiency": item.get("proficiency", "beginner"),
                        "is_learning_goal": item.get("is_learning_goal", False),
                    })
            profile_data["skills"] = skills
            upsert_user_profile(user_id, profile_data)
            return profile_data
    except Exception as e:
        logger.debug(f"Supabase profile load note: {e}")

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")


@router.post("/me", response_model=ProfileResponseSchema, summary="Create or update student profile")
async def update_my_profile(
    profile_in: ProfileCreateUpdateSchema,
    user: AuthenticatedUser = Depends(get_current_user)
):
    # 1. Save in local database
    p_dict = profile_in.model_dump()
    p_dict["id"] = user.id
    p_dict["username"] = profile_in.username or user.username or "student"
    saved_profile = upsert_user_profile(user.id, p_dict)

    # 2. Sync to Supabase if available
    try:
        supabase = get_supabase_client(user.token)
        profile_payload = {
            "id": user.id,
            "display_name": profile_in.display_name,
            "degree": profile_in.degree,
            "branch": profile_in.branch,
            "academic_year": profile_in.academic_year,
            "graduation_year": profile_in.graduation_year,
            "college": profile_in.college,
            "location": profile_in.location,
            "career_interests": profile_in.career_interests,
            "learning_goals": profile_in.learning_goals,
            "opportunity_preferences": profile_in.opportunity_preferences.model_dump() if profile_in.opportunity_preferences else {},
            "portfolio_urls": profile_in.portfolio_urls or {},
            "onboarding_completed": profile_in.onboarding_completed,
        }
        supabase.table("profiles").upsert(profile_payload).execute()
    except Exception as e:
        logger.debug(f"Supabase profile upsert sync note: {e}")

    return saved_profile

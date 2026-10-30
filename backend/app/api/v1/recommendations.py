from typing import List, Optional
import asyncio
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.security import get_current_user, AuthenticatedUser
from app.core.database import get_supabase_client
from app.core.local_db import (
    get_user_profile,
    get_user_saved_opportunity_ids,
    get_user_applications_list
)
from app.services.ai_recommender import recommender
from app.services.eligibility_engine import EligibilityEngine
from app.schemas.recommendation import RecommendationResponseSchema, RecommendationItemSchema
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", response_model=RecommendationResponseSchema, summary="Get personalized AI recommendations")
async def get_recommendations(
    limit: int = Query(10, ge=1, le=50),
    min_score: float = Query(30.0, ge=0.0, le=100.0),
    user: AuthenticatedUser = Depends(get_current_user)
):
    supabase = get_supabase_client(user.token)

    # 1. Fetch student profile (check local_db first, then Supabase)
    profile = get_user_profile(user.id)
    student_skills = []

    if profile:
        student_skills = [s["name"] for s in (profile.get("skills") or []) if s.get("name")]
    else:
        try:
            p_res = supabase.table("profiles").select("*").eq("id", user.id).single().execute()
            if p_res.data:
                profile = p_res.data
                ps_res = supabase.table("profile_skills").select("proficiency, skills(name)").eq("profile_id", user.id).execute()
                for r in (ps_res.data or []):
                    sk = r.get("skills")
                    if sk and sk.get("name"):
                        student_skills.append(sk["name"])
        except Exception as e:
            logger.debug(f"Supabase profile load note: {e}")

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please complete onboarding first."
        )

    if not profile.get("onboarding_completed") and not student_skills:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Onboarding incomplete. Please finish profile setup to receive personalized AI recommendations."
        )

    # 3 & 4. Fetch open opportunities, saved, and applications IN PARALLEL.
    # The Supabase Python client is synchronous, so we offload each call to a
    # thread via asyncio.to_thread to avoid blocking the event loop and to
    # allow all three round-trips to execute concurrently.
    def _fetch_opps():
        return supabase.table("opportunities").select(
            "*, opportunity_skills(requirement_type, skills(id, name, category))"
        ).eq("listing_status", "open").execute()

    def _fetch_saved():
        return supabase.table("saved_opportunities").select("opportunity_id").eq("user_id", user.id).execute()

    def _fetch_apps():
        return supabase.table("applications").select("opportunity_id, stage").eq("user_id", user.id).execute()

    opp_result, saved_result, app_result = await asyncio.gather(
        asyncio.to_thread(_fetch_opps),
        asyncio.to_thread(_fetch_saved),
        asyncio.to_thread(_fetch_apps),
        return_exceptions=True,
    )

    opps = opp_result.data if not isinstance(opp_result, Exception) else []

    # Merge local_db data with Supabase data for saved/apps
    saved_set = set(get_user_saved_opportunity_ids(user.id))
    app_map = {r["opportunity_id"]: r["stage"] for r in get_user_applications_list(user.id)}

    if not isinstance(saved_result, Exception):
        for r in (saved_result.data or []):
            saved_set.add(r["opportunity_id"])
    else:
        logger.debug("Supabase saved_opportunities load note: %s", saved_result)

    if not isinstance(app_result, Exception):
        for r in (app_result.data or []):
            app_map[r["opportunity_id"]] = r["stage"]
    else:
        logger.debug("Supabase applications load note: %s", app_result)

    recommendation_items = []

    for opp in opps:
        raw_opp_skills = opp.pop("opportunity_skills", []) or []
        skills = []
        mandatory_skills = []
        preferred_skills = []

        for os_item in raw_opp_skills:
            sk = os_item.get("skills") or {}
            if sk.get("name"):
                skill_obj = {
                    "id": sk.get("id"),
                    "name": sk.get("name"),
                    "category": sk.get("category"),
                    "requirement_type": os_item.get("requirement_type", "mandatory"),
                }
                skills.append(skill_obj)
                if skill_obj["requirement_type"] == "mandatory":
                    mandatory_skills.append(skill_obj["name"])
                else:
                    preferred_skills.append(skill_obj["name"])

        opp["skills"] = skills
        opp["is_saved"] = opp["id"] in saved_set
        opp["application_stage"] = app_map.get(opp["id"])

        # Independent strict eligibility evaluation
        elig_status, elig_reasons, unmet = EligibilityEngine.evaluate(
            profile=profile,
            opportunity=opp,
            student_skills=student_skills
        )

        # 5-factor hybrid recommendation scoring
        rec_metrics = recommender.rank_opportunity(
            profile=profile,
            opportunity=opp,
            student_skills=student_skills,
            mandatory_skills=mandatory_skills,
            preferred_skills=preferred_skills
        )

        overall_score = rec_metrics["overall_score"]
        opp["match_score"] = overall_score
        opp["eligibility_status"] = elig_status

        if overall_score >= min_score:
            recommendation_items.append({
                "opportunity": opp,
                "overall_score": overall_score,
                "components": rec_metrics["components"],
                "eligibility": {
                    "status": elig_status,
                    "reasons": elig_reasons,
                    "unmet_criteria": unmet,
                },
                "matched_skills": rec_metrics["matched_skills"],
                "missing_skills": rec_metrics["missing_skills"],
                "reasons": rec_metrics["reasons"],
                "next_steps": rec_metrics["next_steps"],
            })

    # Sort descending by overall_score
    recommendation_items.sort(key=lambda x: x["overall_score"], reverse=True)

    return {
        "student_id": user.id,
        "recommendations": recommendation_items[:limit]
    }

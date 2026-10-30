from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user, AuthenticatedUser
from app.core.database import get_supabase_client
from app.core.local_db import (
    get_user_saved_opportunity_ids,
    save_user_opportunity,
    unsave_user_opportunity
)
from app.services.opportunity_service import opportunity_service
from app.schemas.opportunity import OpportunityResponseSchema
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", summary="Get student saved opportunities")
async def get_saved_opportunities(user: AuthenticatedUser = Depends(get_current_user)):
    saved_ids = set(get_user_saved_opportunity_ids(user.id))

    # Also check Supabase if connected
    try:
        supabase = get_supabase_client(user.token)
        res = supabase.table("saved_opportunities").select("opportunity_id").eq("user_id", user.id).execute()
        for r in (res.data or []):
            saved_ids.add(r["opportunity_id"])
    except Exception as e:
        logger.debug(f"Supabase saved opportunities read note: {e}")

    formatted = []
    for opp_id in saved_ids:
        opp = opportunity_service.get_opportunity_by_id(opp_id, user_id=user.id, token=user.token)
        if opp:
            opp["is_saved"] = True
            formatted.append(opp)

    return formatted


@router.post("/{opportunity_id}", summary="Save an opportunity bookmark")
async def save_opportunity(
    opportunity_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    save_user_opportunity(user.id, opportunity_id)

    # Telemetry and Supabase sync
    try:
        supabase = get_supabase_client(user.token)
        supabase.table("saved_opportunities").upsert({
            "user_id": user.id,
            "opportunity_id": opportunity_id
        }, on_conflict="user_id,opportunity_id").execute()
    except Exception as e:
        logger.debug(f"Supabase save sync note: {e}")

    return {"message": "Opportunity saved successfully", "opportunity_id": opportunity_id}


@router.delete("/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Remove saved opportunity bookmark")
async def unsave_opportunity(
    opportunity_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    unsave_user_opportunity(user.id, opportunity_id)

    try:
        supabase = get_supabase_client(user.token)
        supabase.table("saved_opportunities").delete().eq("user_id", user.id).eq("opportunity_id", opportunity_id).execute()
    except Exception as e:
        logger.debug(f"Supabase unsave sync note: {e}")

    return None

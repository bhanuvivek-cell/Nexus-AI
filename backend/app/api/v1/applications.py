from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user, AuthenticatedUser
from app.core.database import get_supabase_client
from app.core.local_db import (
    get_user_applications_list,
    upsert_user_application,
    delete_user_application
)
from app.services.opportunity_service import opportunity_service
from app.schemas.application import ApplicationCreateUpdateSchema, ApplicationResponseSchema
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", response_model=List[ApplicationResponseSchema], summary="Get student application tracker records")
async def get_applications(user: AuthenticatedUser = Depends(get_current_user)):
    apps = get_user_applications_list(user.id)
    seen_opps = set()
    formatted = []

    for app in apps:
        seen_opps.add(app["opportunity_id"])
        opp = opportunity_service.get_opportunity_by_id(app["opportunity_id"], user_id=user.id, token=user.token)
        app_copy = dict(app)
        app_copy["opportunity"] = opp
        formatted.append(app_copy)

    # Check Supabase as well
    try:
        supabase = get_supabase_client(user.token)
        res = supabase.table("applications").select(
            "*, opportunities(*, opportunity_skills(requirement_type, skills(id, name, category)))"
        ).eq("user_id", user.id).order("updated_at", desc=True).execute()

        for s_app in (res.data or []):
            if s_app.get("opportunity_id") not in seen_opps:
                opp = s_app.pop("opportunities", None)
                if opp:
                    raw_skills = opp.pop("opportunity_skills", []) or []
                    opp["skills"] = [
                        {"id": item["skills"]["id"], "name": item["skills"]["name"], "category": item["skills"].get("category"), "requirement_type": item.get("requirement_type", "mandatory")}
                        for item in raw_skills if item.get("skills")
                    ]
                    s_app["opportunity"] = opp
                formatted.append(s_app)
    except Exception as e:
        logger.debug(f"Supabase applications read note: {e}")

    return formatted


@router.post("", response_model=ApplicationResponseSchema, summary="Track or update application stage")
async def update_application(
    app_in: ApplicationCreateUpdateSchema,
    user: AuthenticatedUser = Depends(get_current_user)
):
    valid_stages = ['Saved', 'Planned', 'Applied', 'Interview', 'Offer', 'Rejected/Closed']
    if app_in.stage not in valid_stages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid stage. Must be one of: {', '.join(valid_stages)}"
        )

    # 1. Save in local database
    app_record = upsert_user_application(
        user_id=user.id,
        opp_id=app_in.opportunity_id,
        stage=app_in.stage,
        notes=app_in.notes or "",
        applied_date=str(app_in.applied_date) if app_in.applied_date else None
    )

    opp = opportunity_service.get_opportunity_by_id(app_in.opportunity_id, user_id=user.id, token=user.token)
    app_record["opportunity"] = opp

    # 2. Sync to Supabase
    try:
        supabase = get_supabase_client(user.token)
        payload = {
            "user_id": user.id,
            "opportunity_id": app_in.opportunity_id,
            "stage": app_in.stage,
            "notes": app_in.notes or "",
            "applied_date": str(app_in.applied_date) if app_in.applied_date else None,
        }
        supabase.table("applications").upsert(payload, on_conflict="user_id,opportunity_id").execute()
    except Exception as e:
        logger.debug(f"Supabase application sync note: {e}")

    return app_record


@router.delete("/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Remove application from tracker")
async def delete_application_route(
    opportunity_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    delete_user_application(user.id, opportunity_id)

    try:
        supabase = get_supabase_client(user.token)
        supabase.table("applications").delete().eq("user_id", user.id).eq("opportunity_id", opportunity_id).execute()
    except Exception as e:
        logger.debug(f"Supabase delete application sync note: {e}")

    return None

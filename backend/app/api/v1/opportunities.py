from typing import Optional
from fastapi import APIRouter, Query, Depends, HTTPException, status
from app.core.security import get_optional_user, AuthenticatedUser
from app.services.opportunity_service import opportunity_service
from app.schemas.opportunity import OpportunityListResponseSchema, OpportunityResponseSchema

router = APIRouter()


@router.get("", response_model=OpportunityListResponseSchema, summary="Search and filter verified opportunities")
async def list_opportunities(
    query: Optional[str] = Query(None, description="Search term across title, provider, or description"),
    type: Optional[str] = Query(None, description="Opportunity type: internship, hackathon, open_source, etc."),
    work_mode: Optional[str] = Query(None, description="remote, hybrid, or on_site"),
    location: Optional[str] = Query(None, description="City or State"),
    stipend: Optional[str] = Query(None, description="paid_only or any"),
    sort_by: str = Query("recent", description="recent or deadline"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    user_id = user.id if user else None
    token = user.token if user else None
    result = opportunity_service.get_opportunities(
        query=query,
        opp_type=type,
        work_mode=work_mode,
        location=location,
        stipend_filter=stipend,
        sort_by=sort_by,
        page=page,
        page_size=page_size,
        user_id=user_id,
        token=token,
    )
    return result


@router.get("/{opportunity_id}", summary="Get opportunity details with eligibility & match evaluation")
async def get_opportunity(
    opportunity_id: str,
    user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    user_id = user.id if user else None
    token = user.token if user else None
    item = opportunity_service.get_opportunity_by_id(opportunity_id, user_id=user_id, token=token)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Opportunity listing not found"
        )
    return item

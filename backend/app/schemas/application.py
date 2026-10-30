from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, date
from app.schemas.opportunity import OpportunityResponseSchema


class ApplicationCreateUpdateSchema(BaseModel):
    opportunity_id: str
    stage: str = Field(..., description="Saved, Planned, Applied, Interview, Offer, Rejected/Closed")
    notes: Optional[str] = ""
    applied_date: Optional[date] = None


class ApplicationResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    opportunity_id: str
    stage: str
    notes: Optional[str] = ""
    applied_date: Optional[date] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    opportunity: Optional[OpportunityResponseSchema] = None

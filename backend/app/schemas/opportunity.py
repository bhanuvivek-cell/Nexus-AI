from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime


class OpportunitySkillSchema(BaseModel):
    id: str
    name: str
    category: Optional[str] = None
    requirement_type: str = "mandatory"  # mandatory or preferred


class OpportunityResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    provider: str
    opportunity_type: str
    description: str
    location: str
    work_mode: str
    mandatory_requirements: Dict[str, Any] = Field(default_factory=dict)
    preferred_qualifications: Dict[str, Any] = Field(default_factory=dict)
    deadline: Optional[datetime] = None
    stipend_amount: Optional[float] = None
    stipend_type: str = "fixed"
    stipend_currency: str = "INR"
    official_apply_url: str
    source_url: str
    source_name: str
    first_seen: Optional[datetime] = None
    last_checked: Optional[datetime] = None
    verification_status: str = "verified"
    listing_status: str = "open"
    skills: List[OpportunitySkillSchema] = Field(default_factory=list)
    is_saved: Optional[bool] = False
    application_stage: Optional[str] = None
    match_score: Optional[float] = None
    eligibility_status: Optional[str] = None


class OpportunityListResponseSchema(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[OpportunityResponseSchema]

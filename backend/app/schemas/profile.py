from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class SkillItemSchema(BaseModel):
    id: Optional[str] = None
    name: str
    category: Optional[str] = None
    proficiency: str = Field(default="beginner", description="beginner, intermediate, or advanced")
    is_learning_goal: bool = False


class OpportunityPreferencesSchema(BaseModel):
    preferred_types: List[str] = Field(default=["internship", "hackathon"])
    work_mode: str = Field(default="any", description="remote, hybrid, on_site, or any")
    stipend_preference: str = Field(default="flexible", description="paid_only, any, or flexible")
    preferred_locations: List[str] = Field(default=["Pan-India"])


class ProfileBaseSchema(BaseModel):
    display_name: str
    username: Optional[str] = None
    degree: str = "BTech"
    branch: str = "Computer Science & Engineering"
    academic_year: int = Field(default=1, ge=1, le=5)
    graduation_year: int
    college: Optional[str] = None
    location: Optional[str] = None
    career_interests: List[str] = Field(default_factory=list)
    learning_goals: List[str] = Field(default_factory=list)
    opportunity_preferences: Optional[OpportunityPreferencesSchema] = None
    portfolio_urls: Optional[Dict[str, Optional[str]]] = None
    onboarding_completed: bool = False


class ProfileCreateUpdateSchema(ProfileBaseSchema):
    skills: List[SkillItemSchema] = Field(default_factory=list)


class ProfileResponseSchema(ProfileBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: str
    skills: List[SkillItemSchema] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.opportunity import OpportunityResponseSchema


class MatchComponentsSchema(BaseModel):
    skill_match_K: float = Field(..., description="Structured skill match (0-100)")
    semantic_relevance_M: float = Field(..., description="Sentence transformer semantic relevance (0-100)")
    interest_match_I: float = Field(..., description="Career interest alignment (0-100)")
    preference_match_P: float = Field(..., description="Opportunity preference match (0-100)")
    goal_alignment_G: float = Field(..., description="Career learning goal synergy (0-100)")


class EligibilityResultSchema(BaseModel):
    status: str = Field(..., description="Eligible | Potentially eligible | Not eligible")
    reasons: List[str] = Field(default_factory=list)
    unmet_criteria: List[str] = Field(default_factory=list)


class RecommendationItemSchema(BaseModel):
    opportunity: OpportunityResponseSchema
    overall_score: float = Field(..., description="Weighted composite recommendation score S (0-100)")
    components: MatchComponentsSchema
    eligibility: EligibilityResultSchema
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    reasons: List[str] = Field(default_factory=list)
    next_steps: str = Field(default="", description="Suggested actionable steps for student")


class RecommendationResponseSchema(BaseModel):
    student_id: str
    recommendations: List[RecommendationItemSchema]

from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class LearningResourceSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    provider: str
    description: str
    skill_name: str
    official_url: str
    is_free: bool = True
    cost_details: str = "Free"
    difficulty_level: Optional[str] = "beginner"
    verification_status: str = "verified"


class SkillGapItemSchema(BaseModel):
    skill_name: str
    frequency: int = Field(default=1, description="Frequency required across target opportunities")
    category: str = "Technical"
    learning_resources: List[LearningResourceSchema] = Field(default_factory=list)


class SkillRoadmapResponseSchema(BaseModel):
    student_id: str
    matched_skills: List[str] = Field(default_factory=list)
    prioritized_missing_skills: List[SkillGapItemSchema] = Field(default_factory=list)

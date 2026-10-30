export type DegreeType = 'BTech' | 'BE' | 'BCA' | 'BSc' | 'MTech' | 'MCA' | 'Diploma' | 'Other';

export type WorkMode = 'remote' | 'hybrid' | 'on_site';

export type OpportunityType =
  | 'internship'
  | 'entry_level_job'
  | 'hackathon'
  | 'certification'
  | 'open_source'
  | 'research'
  | 'project';

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced';

export type EligibilityStatus = 'Eligible' | 'Potentially eligible' | 'Not eligible';

export type ApplicationStage =
  | 'Saved'
  | 'Planned'
  | 'Applied'
  | 'Interview'
  | 'Offer'
  | 'Rejected/Closed';

export interface OpportunityPreferences {
  preferred_types: OpportunityType[];
  work_mode: WorkMode | 'any';
  stipend_preference: 'paid_only' | 'any' | 'flexible';
  preferred_locations: string[];
}

export interface PortfolioUrls {
  github?: string;
  linkedin?: string;
  portfolio?: string;
  resume_link?: string;
}

export interface SkillItem {
  id?: string;
  name: string;
  category?: string;
  proficiency: ProficiencyLevel;
  is_learning_goal?: boolean;
}

export interface NexusUser {
  id: string;
  username: string;
  role: string;
}

export interface UserProfile {
  id: string;
  username?: string;
  display_name: string;
  degree: DegreeType | string;
  branch: string;
  academic_year: number;
  graduation_year: number;
  college?: string;
  location?: string;
  career_interests: string[];
  learning_goals: string[];
  opportunity_preferences: OpportunityPreferences;
  portfolio_urls: PortfolioUrls;
  skills: SkillItem[];
  onboarding_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OpportunitySkill {
  id: string;
  name: string;
  category: string;
  requirement_type: 'mandatory' | 'preferred';
}

export interface MandatoryRequirements {
  degrees?: string[];
  graduation_years?: number[];
  min_academic_year?: number;
  mandatory_skills?: string[];
  min_cgpa?: number;
  additional_notes?: string;
}

export interface PreferredQualifications {
  preferred_skills?: string[];
  preferred_interests?: string[];
  notes?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  provider: string;
  opportunity_type: OpportunityType;
  description: string;
  location: string;
  work_mode: WorkMode;
  mandatory_requirements: MandatoryRequirements;
  preferred_qualifications: PreferredQualifications;
  deadline?: string | null;
  stipend_amount?: number | null;
  stipend_type: string;
  stipend_currency: string;
  official_apply_url: string;
  source_url: string;
  source_name: string;
  first_seen: string;
  last_checked: string;
  verification_status: 'verified' | 'unverified' | 'stale';
  listing_status: 'open' | 'closed' | 'upcoming';
  skills?: OpportunitySkill[];
  is_saved?: boolean;
  application_stage?: ApplicationStage | null;
  match_score?: number;
  eligibility_status?: EligibilityStatus;
}

export interface MatchComponents {
  skill_match_K: number;
  semantic_relevance_M: number;
  interest_match_I: number;
  preference_match_P: number;
  goal_alignment_G: number;
}

export interface EligibilityResult {
  status: EligibilityStatus;
  reasons: string[];
  unmet_criteria: string[];
}

export interface Recommendation {
  opportunity: Opportunity;
  overall_score: number;
  components: MatchComponents;
  eligibility: EligibilityResult;
  matched_skills: string[];
  missing_skills: string[];
  reasons: string[];
  next_steps: string;
}

export interface Application {
  id: string;
  opportunity_id: string;
  user_id: string;
  stage: ApplicationStage;
  notes?: string;
  applied_date?: string | null;
  created_at: string;
  updated_at: string;
  opportunity?: Opportunity;
}

export interface LearningResource {
  id: string;
  title: string;
  provider: string;
  description: string;
  skill_name: string;
  official_url: string;
  is_free: boolean;
  cost_details: string;
  difficulty_level: ProficiencyLevel;
  verification_status: string;
}

export interface SkillGapItem {
  skill_name: string;
  frequency: number;
  category: string;
  learning_resources: LearningResource[];
}

export interface SkillRoadmapResponse {
  student_id: string;
  matched_skills: string[];
  prioritized_missing_skills: SkillGapItem[];
}

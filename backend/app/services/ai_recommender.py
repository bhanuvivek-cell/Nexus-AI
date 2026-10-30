import logging
import math
from typing import Dict, Any, List, Optional, Tuple
import numpy as np

logger = logging.getLogger(__name__)

# Canonical alias mapping for robust skill normalization
ALIAS_MAP = {
    "dsa": "Data Structures & Algorithms",
    "data structures": "Data Structures & Algorithms",
    "algorithms": "Data Structures & Algorithms",
    "ml": "Machine Learning",
    "machine-learning": "Machine Learning",
    "dl": "Deep Learning",
    "neural networks": "Deep Learning",
    "nlp": "Natural Language Processing",
    "cv": "Computer Vision",
    "image processing": "Computer Vision",
    "py": "Python",
    "python3": "Python",
    "js": "JavaScript",
    "es6": "JavaScript",
    "ts": "TypeScript",
    "cpp": "C++",
    "c plus plus": "C++",
    "golang": "Go",
    "k8s": "Kubernetes",
    "aws": "AWS",
    "amazon web services": "AWS",
    "gcp": "Google Cloud Platform",
    "azure": "Microsoft Azure",
    "oops": "Object Oriented Programming",
    "oop": "Object Oriented Programming",
    "dbms": "Database Management Systems",
    "cn": "Computer Networks",
    "networking": "Computer Networks",
    "os": "Operating Systems",
    "fast api": "FastAPI",
    "nextjs": "Next.js",
    "reactjs": "React",
    "react.js": "React",
    "nodejs": "Node.js",
    "html": "HTML/CSS",
    "css": "HTML/CSS",
}


def normalize_skill(name: str) -> str:
    cleaned = name.strip().lower()
    return ALIAS_MAP.get(cleaned, name.strip())


class AIRecommender:
    """
    Transparent 5-Factor Hybrid AI Recommendation Engine:
    S = 0.35K + 0.25M + 0.15I + 0.15P + 0.10G
    """
    def __init__(self):
        self._model = None
        self._model_loading = False
        self._embedding_cache: Dict[str, np.ndarray] = {}

    def _get_model(self):
        if self._model is not None:
            return self._model
        if self._model_loading:
            return None
        try:
            self._model_loading = True
            from sentence_transformers import SentenceTransformer
            logger.info("Loading SentenceTransformer all-MiniLM-L6-v2 model...")
            try:
                self._model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2", local_files_only=True)
            except Exception:
                self._model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
            logger.info("SentenceTransformer model loaded successfully.")
            return self._model
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformer: {e}. Fallback to token similarity.")
            return None
        finally:
            self._model_loading = False

    def get_embedding(self, text: str) -> np.ndarray:
        if text in self._embedding_cache:
            return self._embedding_cache[text]
        model = self._get_model()
        if model:
            emb = model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
            self._embedding_cache[text] = emb
            return emb
        else:
            # Fallback simple deterministic pseudo-embedding based on hash buckets for consistency
            vec = np.zeros(384, dtype=np.float32)
            words = text.lower().split()
            for w in words:
                idx = hash(w) % 384
                vec[idx] += 1.0
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec /= norm
            self._embedding_cache[text] = vec
            return vec

    def compute_semantic_relevance(self, student_text: str, opportunity_text: str) -> float:
        """
        Calculates cosine similarity between normalized 384-d vectors, scaled to [0, 100].
        """
        emb_s = self.get_embedding(student_text)
        emb_o = self.get_embedding(opportunity_text)
        cos_sim = float(np.dot(emb_s, emb_o))
        # Clamp to [0, 1] then scale to [0, 100]
        score = max(0.0, min(1.0, (cos_sim + 1.0) / 2.0 if cos_sim < 0 else cos_sim)) * 100.0
        return round(score, 1)

    def compute_skill_match_K(
        self,
        student_skills: List[str],
        mandatory_skills: List[str],
        preferred_skills: List[str]
    ) -> Tuple[float, List[str], List[str]]:
        """
        K = 0.70 * K_mand + 0.30 * K_pref
        """
        norm_student = set(normalize_skill(s) for s in student_skills)
        norm_mand = [normalize_skill(s) for s in mandatory_skills]
        norm_pref = [normalize_skill(s) for s in preferred_skills]

        # Matched and missing
        matched = []
        missing = []

        # Mandatory scoring
        if not norm_mand:
            k_mand = 100.0
        else:
            mand_matches = 0
            for orig, norm in zip(mandatory_skills, norm_mand):
                if norm in norm_student:
                    mand_matches += 1
                    matched.append(orig)
                else:
                    missing.append(orig)
            k_mand = (mand_matches / len(norm_mand)) * 100.0

        # Preferred scoring
        if not norm_pref:
            k_pref = 100.0
        else:
            pref_matches = 0
            for orig, norm in zip(preferred_skills, norm_pref):
                if norm in norm_student:
                    pref_matches += 1
                    if orig not in matched:
                        matched.append(orig)
                else:
                    if orig not in missing:
                        missing.append(orig)
            k_pref = (pref_matches / len(norm_pref)) * 100.0

        K = 0.70 * k_mand + 0.30 * k_pref
        return round(K, 1), matched, missing

    def compute_interest_match_I(
        self,
        student_interests: List[str],
        opportunity_interests: List[str],
        opp_description: str
    ) -> float:
        if not student_interests:
            return 50.0  # Neutral baseline if no interests declared

        student_set = set(i.lower().strip() for i in student_interests)
        opp_set = set(i.lower().strip() for i in opportunity_interests)

        # Overlap in explicit tags
        intersection = student_set.intersection(opp_set)
        if opp_set:
            score = (len(intersection) / len(opp_set)) * 100.0
        else:
            # Check text presence
            desc_lower = opp_description.lower()
            matches = sum(1 for i in student_interests if i.lower() in desc_lower)
            score = (matches / len(student_interests)) * 100.0

        return round(min(100.0, max(20.0, score)), 1)

    def compute_preference_match_P(
        self,
        student_prefs: Dict[str, Any],
        opportunity: Dict[str, Any]
    ) -> float:
        score = 0.0

        # 1. Opportunity Type (30%)
        preferred_types = student_prefs.get("preferred_types") or []
        opp_type = opportunity.get("opportunity_type")
        if not preferred_types or opp_type in preferred_types:
            score += 30.0
        else:
            score += 10.0

        # 2. Work Mode (30%)
        desired_mode = (student_prefs.get("work_mode") or "any").lower()
        opp_mode = (opportunity.get("work_mode") or "").lower()
        if desired_mode == "any" or desired_mode == opp_mode:
            score += 30.0
        elif (desired_mode == "hybrid" and opp_mode in ["remote", "on_site"]) or (opp_mode == "hybrid"):
            score += 20.0
        else:
            score += 5.0

        # 3. Location (20%)
        preferred_locs = [l.lower() for l in (student_prefs.get("preferred_locations") or [])]
        opp_loc = (opportunity.get("location") or "").lower()
        if not preferred_locs or "pan-india" in preferred_locs or "remote" in opp_loc or "pan-india" in opp_loc:
            score += 20.0
        elif any(loc in opp_loc for loc in preferred_locs):
            score += 20.0
        else:
            score += 5.0

        # 4. Stipend Preference (20%)
        stipend_pref = student_prefs.get("stipend_preference") or "flexible"
        stipend_amount = opportunity.get("stipend_amount")
        is_paid = stipend_amount is not None and stipend_amount > 0
        if stipend_pref in ["flexible", "any"]:
            score += 20.0
        elif stipend_pref == "paid_only":
            score += 20.0 if is_paid else 0.0

        return round(score, 1)

    def compute_goal_alignment_G(
        self,
        learning_goals: List[str],
        all_opp_skills: List[str]
    ) -> float:
        if not learning_goals:
            return 70.0  # Moderate baseline when no specific learning goals specified

        norm_goals = set(normalize_skill(g) for g in learning_goals)
        norm_opp_skills = set(normalize_skill(s) for s in all_opp_skills)

        synergy_count = len(norm_goals.intersection(norm_opp_skills))
        if synergy_count > 0:
            score = 60.0 + min(40.0, (synergy_count / len(norm_goals)) * 40.0)
        else:
            score = 40.0

        return round(score, 1)

    def rank_opportunity(
        self,
        profile: Dict[str, Any],
        opportunity: Dict[str, Any],
        student_skills: List[str],
        mandatory_skills: List[str],
        preferred_skills: List[str]
    ) -> Dict[str, Any]:
        """
        Calculates all 5 components and composite ranking:
        S = 0.35K + 0.25M + 0.15I + 0.15P + 0.10G
        """
        # 1. K Component
        K, matched_skills, missing_skills = self.compute_skill_match_K(
            student_skills=student_skills,
            mandatory_skills=mandatory_skills,
            preferred_skills=preferred_skills
        )

        # 2. M Component (Semantic)
        student_summary = (
            f"Degree: {profile.get('degree', '')} {profile.get('branch', '')}. "
            f"Skills: {', '.join(student_skills)}. "
            f"Interests: {', '.join(profile.get('career_interests') or [])}. "
            f"Goals: {', '.join(profile.get('learning_goals') or [])}."
        )
        opp_summary = (
            f"Title: {opportunity.get('title', '')} by {opportunity.get('provider', '')}. "
            f"Type: {opportunity.get('opportunity_type', '')}. "
            f"Description: {opportunity.get('description', '')}. "
            f"Requirements: {', '.join(mandatory_skills + preferred_skills)}."
        )
        M = self.compute_semantic_relevance(student_summary, opp_summary)

        # 3. I Component
        pref_qual = opportunity.get("preferred_qualifications") or {}
        opp_interests = pref_qual.get("preferred_interests") or []
        I = self.compute_interest_match_I(
            student_interests=profile.get("career_interests") or [],
            opportunity_interests=opp_interests,
            opp_description=opportunity.get("description", "")
        )

        # 4. P Component
        P = self.compute_preference_match_P(
            student_prefs=profile.get("opportunity_preferences") or {},
            opportunity=opportunity
        )

        # 5. G Component
        G = self.compute_goal_alignment_G(
            learning_goals=profile.get("learning_goals") or [],
            all_opp_skills=mandatory_skills + preferred_skills
        )

        # Overall composite score
        S = round(0.35 * K + 0.25 * M + 0.15 * I + 0.15 * P + 0.10 * G, 1)

        # Generate reasons for match
        reasons = []
        if K >= 80:
            reasons.append(f"Strong skill alignment with {len(matched_skills)} verified matched skills.")
        if M >= 75:
            reasons.append("High contextual relevance to your academic background and profile.")
        if I >= 75:
            reasons.append("Directly aligns with your stated career interests.")
        if P >= 85:
            reasons.append("Matches your work mode, type, and location preferences.")
        if G >= 75:
            reasons.append("Provides practical experience in skills you want to learn.")
        if not reasons:
            reasons.append("Good entry-level opportunity to build relevant domain experience.")

        # Actionable next steps
        if missing_skills:
            next_steps = f"Prioritize learning {missing_skills[0]} to maximize your qualification index."
        else:
            next_steps = "Your skill qualifications are complete. Prepare your portfolio and apply directly."

        return {
            "overall_score": S,
            "components": {
                "skill_match_K": K,
                "semantic_relevance_M": M,
                "interest_match_I": I,
                "preference_match_P": P,
                "goal_alignment_G": G,
            },
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "reasons": reasons,
            "next_steps": next_steps,
        }


recommender = AIRecommender()

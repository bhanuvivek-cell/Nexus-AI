from typing import Dict, Any, List, Optional
from collections import Counter
from app.core.database import get_supabase_client
from app.core.local_db import get_user_profile
from app.services.ai_recommender import normalize_skill
import logging

logger = logging.getLogger(__name__)


class SkillGapEngine:
    @staticmethod
    def generate_roadmap(user_id: str, token: Optional[str] = None) -> Dict[str, Any]:
        supabase = get_supabase_client(token)

        # 1. Fetch user's current skills (local profile or Supabase)
        student_skills = []
        local_p = get_user_profile(user_id)
        if local_p and local_p.get("skills"):
            student_skills = [s["name"] for s in local_p["skills"] if s.get("name")]
        else:
            try:
                ps_res = supabase.table("profile_skills").select(
                    "proficiency, is_learning_goal, skills(id, name, category)"
                ).eq("profile_id", user_id).execute()

                for r in (ps_res.data or []):
                    sk = r.get("skills")
                    if sk and sk.get("name"):
                        student_skills.append(sk["name"])
            except Exception as e:
                logger.debug(f"Supabase profile skills load note: {e}")

        norm_student = set(normalize_skill(s) for s in student_skills)

        # 2. Fetch opportunities (all verified open opportunities)
        opp_res = supabase.table("opportunities").select(
            "id, title, opportunity_skills(requirement_type, skills(id, name, category))"
        ).eq("listing_status", "open").execute()

        opps = opp_res.data or []

        # Count frequencies of missing skills across opportunities
        missing_skill_counter = Counter()
        skill_metadata = {}

        for opp in opps:
            for os_item in (opp.get("opportunity_skills") or []):
                sk = os_item.get("skills") or {}
                raw_name = sk.get("name")
                if not raw_name:
                    continue

                norm_name = normalize_skill(raw_name)
                # Store display name and category
                if norm_name not in skill_metadata:
                    skill_metadata[norm_name] = {
                        "display_name": raw_name,
                        "category": sk.get("category") or "Technical Skills"
                    }

                # If student does not have this skill, increment demand counter
                if norm_name not in norm_student:
                    missing_skill_counter[norm_name] += 1

        # 3. Fetch verified learning resources
        lr_res = supabase.table("learning_resources").select("*").execute()
        all_resources = lr_res.data or []

        # Map resources by normalized skill name
        resource_map: Dict[str, List[Dict[str, Any]]] = {}
        for res in all_resources:
            sk_name = res.get("skill_name") or ""
            norm_sk = normalize_skill(sk_name)
            if norm_sk not in resource_map:
                resource_map[norm_sk] = []
            resource_map[norm_sk].append(res)

        # 4. Build prioritized roadmap
        prioritized = []
        for norm_name, count in missing_skill_counter.most_common(8):
            meta = skill_metadata.get(norm_name, {"display_name": norm_name, "category": "Technical Skills"})
            resources = resource_map.get(norm_name, [])

            prioritized.append({
                "skill_name": meta["display_name"],
                "frequency": count,
                "category": meta["category"],
                "learning_resources": resources
            })

        return {
            "student_id": user_id,
            "matched_skills": student_skills,
            "prioritized_missing_skills": prioritized
        }


skill_gap_engine = SkillGapEngine()

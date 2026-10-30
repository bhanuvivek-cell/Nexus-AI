from typing import Dict, Any, List, Optional
from app.core.database import get_supabase_client
from app.core.local_db import (
    get_user_saved_opportunity_ids,
    get_user_applications_list,
    get_user_profile
)
from app.services.eligibility_engine import EligibilityEngine
from app.services.ai_recommender import recommender
import logging

logger = logging.getLogger(__name__)


class OpportunityService:
    @staticmethod
    def get_opportunities(
        query: Optional[str] = None,
        opp_type: Optional[str] = None,
        work_mode: Optional[str] = None,
        location: Optional[str] = None,
        stipend_filter: Optional[str] = None,
        sort_by: str = "recent",
        page: int = 1,
        page_size: int = 12,
        user_id: Optional[str] = None,
        token: Optional[str] = None
    ) -> Dict[str, Any]:
        supabase = get_supabase_client(token)

        # Build base query
        builder = supabase.table("opportunities").select(
            "*, opportunity_skills(requirement_type, skills(id, name, category))",
            count="exact"
        )

        # Filters
        if query:
            # Multi-field search
            builder = builder.or_(f"title.ilike.%{query}%,provider.ilike.%{query}%,description.ilike.%{query}%")
        if opp_type:
            builder = builder.eq("opportunity_type", opp_type)
        if work_mode:
            builder = builder.eq("work_mode", work_mode)
        if location:
            builder = builder.ilike("location", f"%{location}%")
        if stipend_filter == "paid_only":
            builder = builder.gt("stipend_amount", 0)

        # Sorting
        if sort_by == "deadline":
            builder = builder.order("deadline", desc=False, nulls_first=False)
        else:
            builder = builder.order("created_at", desc=True)

        # Pagination
        start = (page - 1) * page_size
        end = start + page_size - 1
        builder = builder.range(start, end)

        res = builder.execute()
        items = res.data or []
        total = res.count or len(items)

        # Retrieve user saved and applications if authenticated
        saved_set = set(get_user_saved_opportunity_ids(user_id)) if user_id else set()
        app_stage_map = {r["opportunity_id"]: r["stage"] for r in get_user_applications_list(user_id)} if user_id else {}
        if user_id:
            try:
                saved_res = supabase.table("saved_opportunities").select("opportunity_id").eq("user_id", user_id).execute()
                for r in (saved_res.data or []):
                    saved_set.add(r["opportunity_id"])

                app_res = supabase.table("applications").select("opportunity_id, stage").eq("user_id", user_id).execute()
                for r in (app_res.data or []):
                    app_stage_map[r["opportunity_id"]] = r["stage"]
            except Exception as e:
                logger.debug(f"Could not load user saved/apps from Supabase: {e}")

        # Format items with skills
        formatted_items = []
        for item in items:
            raw_opp_skills = item.pop("opportunity_skills", []) or []
            skills = []
            for os_item in raw_opp_skills:
                sk = os_item.get("skills") or {}
                if sk.get("name"):
                    skills.append({
                        "id": sk.get("id"),
                        "name": sk.get("name"),
                        "category": sk.get("category"),
                        "requirement_type": os_item.get("requirement_type", "mandatory"),
                    })
            item["skills"] = skills
            item["is_saved"] = item["id"] in saved_set
            item["application_stage"] = app_stage_map.get(item["id"])
            formatted_items.append(item)

        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "items": formatted_items,
        }

    @staticmethod
    def get_opportunity_by_id(
        opportunity_id: str,
        user_id: Optional[str] = None,
        token: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        supabase = get_supabase_client(token)
        res = supabase.table("opportunities").select(
            "*, opportunity_skills(requirement_type, skills(id, name, category))"
        ).eq("id", opportunity_id).single().execute()

        if not res.data:
            return None

        item = res.data
        raw_opp_skills = item.pop("opportunity_skills", []) or []
        skills = []
        mandatory_skills = []
        preferred_skills = []

        for os_item in raw_opp_skills:
            sk = os_item.get("skills") or {}
            if sk.get("name"):
                skill_obj = {
                    "id": sk.get("id"),
                    "name": sk.get("name"),
                    "category": sk.get("category"),
                    "requirement_type": os_item.get("requirement_type", "mandatory"),
                }
                skills.append(skill_obj)
                if skill_obj["requirement_type"] == "mandatory":
                    mandatory_skills.append(skill_obj["name"])
                else:
                    preferred_skills.append(skill_obj["name"])

        item["skills"] = skills
        item["is_saved"] = False
        item["application_stage"] = None

        # Check user specific profile & evaluation if logged in
        if user_id:
            try:
                # 1. Local saved and application stage
                saved_ids = get_user_saved_opportunity_ids(user_id)
                if opportunity_id in saved_ids:
                    item["is_saved"] = True

                apps = get_user_applications_list(user_id)
                for a in apps:
                    if a["opportunity_id"] == opportunity_id:
                        item["application_stage"] = a["stage"]
                        break

                # 2. Local profile or Supabase profile
                profile = get_user_profile(user_id)
                student_skills = []
                if profile:
                    student_skills = [s["name"] for s in (profile.get("skills") or []) if s.get("name")]
                else:
                    try:
                        s_res = supabase.table("saved_opportunities").select("id").eq("user_id", user_id).eq("opportunity_id", opportunity_id).execute()
                        if s_res.data:
                            item["is_saved"] = True

                        a_res = supabase.table("applications").select("stage").eq("user_id", user_id).eq("opportunity_id", opportunity_id).execute()
                        if a_res.data:
                            item["application_stage"] = a_res.data[0]["stage"]

                        p_res = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
                        if p_res.data:
                            profile = p_res.data
                            ps_res = supabase.table("profile_skills").select("skills(name)").eq("profile_id", user_id).execute()
                            student_skills = [r["skills"]["name"] for r in (ps_res.data or []) if r.get("skills")]
                    except Exception as e:
                        logger.debug(f"Supabase opportunity enrich note: {e}")

                if profile:
                    elig_status, elig_reasons, unmet = EligibilityEngine.evaluate(profile, item, student_skills)
                    item["eligibility"] = {
                        "status": elig_status,
                        "reasons": elig_reasons,
                        "unmet_criteria": unmet,
                    }
                    item["eligibility_status"] = elig_status

                    rec_result = recommender.rank_opportunity(
                        profile=profile,
                        opportunity=item,
                        student_skills=student_skills,
                        mandatory_skills=mandatory_skills,
                        preferred_skills=preferred_skills,
                    )
                    item["match_score"] = rec_result["overall_score"]
                    item["match_breakdown"] = rec_result
            except Exception as e:
                logger.warning(f"Error enriching opportunity for user {user_id}: {e}")

        return item


opportunity_service = OpportunityService()

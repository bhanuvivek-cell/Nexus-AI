import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

_CUR_DIR = Path(__file__).resolve().parent
_OPP_PATH = _CUR_DIR / "fallback_opportunities.json"
_SKILLS_PATH = _CUR_DIR / "fallback_skills.json"

_cached_opps: Optional[List[Dict[str, Any]]] = None
_cached_skills: Optional[List[Dict[str, Any]]] = None


def get_all_fallback_opportunities() -> List[Dict[str, Any]]:
    global _cached_opps
    if _cached_opps is None:
        try:
            if _OPP_PATH.exists():
                _cached_opps = json.loads(_OPP_PATH.read_text(encoding="utf-8"))
            else:
                _cached_opps = []
        except Exception as e:
            logger.warning(f"Error loading fallback_opportunities.json: {e}")
            _cached_opps = []
    return [dict(item) for item in _cached_opps]


def get_all_fallback_skills() -> List[Dict[str, Any]]:
    global _cached_skills
    if _cached_skills is None:
        try:
            if _SKILLS_PATH.exists():
                _cached_skills = json.loads(_SKILLS_PATH.read_text(encoding="utf-8"))
            else:
                _cached_skills = []
        except Exception as e:
            logger.warning(f"Error loading fallback_skills.json: {e}")
            _cached_skills = []
    return [dict(item) for item in _cached_skills]


def load_fallback_opportunities(
    query: Optional[str] = None,
    opp_type: Optional[str] = None,
    work_mode: Optional[str] = None,
    location: Optional[str] = None,
    stipend_filter: Optional[str] = None,
    sort_by: str = "recent"
) -> List[Dict[str, Any]]:
    items = get_all_fallback_opportunities()

    if query:
        q = query.strip().lower()
        items = [
            it for it in items
            if q in (it.get("title") or "").lower()
            or q in (it.get("provider") or "").lower()
            or q in (it.get("description") or "").lower()
            or any(q in (s.get("name") or "").lower() for s in (it.get("skills") or []))
        ]

    if opp_type:
        items = [it for it in items if (it.get("opportunity_type") or "").lower() == opp_type.lower()]

    if work_mode:
        items = [it for it in items if (it.get("work_mode") or "").lower() == work_mode.lower()]

    if location:
        loc = location.strip().lower()
        items = [it for it in items if loc in (it.get("location") or "").lower()]

    if stipend_filter == "paid_only":
        items = [it for it in items if (it.get("stipend_amount") or 0) > 0]

    if sort_by == "deadline":
        items.sort(key=lambda x: x.get("deadline") or "9999-12-31")
    else:
        items.sort(key=lambda x: x.get("created_at") or "", reverse=True)

    return items


def get_fallback_opportunity_by_id(opportunity_id: str) -> Optional[Dict[str, Any]]:
    for item in get_all_fallback_opportunities():
        if item.get("id") == opportunity_id:
            return dict(item)
    return None


def load_fallback_skills(
    query: Optional[str] = None,
    category: Optional[str] = None
) -> List[Dict[str, Any]]:
    items = get_all_fallback_skills()
    if query:
        q = query.strip().lower()
        items = [
            it for it in items
            if q in (it.get("name") or "").lower()
            or any(q in a.lower() for a in (it.get("aliases") or []))
        ]
    if category:
        items = [it for it in items if (it.get("category") or "").lower() == category.lower()]
    return items


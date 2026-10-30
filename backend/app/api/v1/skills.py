from typing import List, Optional
from fastapi import APIRouter, Query
from app.core.database import get_supabase_client

router = APIRouter()


@router.get("", summary="Get canonical skills catalogue")
async def get_skills(
    query: Optional[str] = Query(None, description="Search term for skill name"),
    category: Optional[str] = Query(None, description="Filter by skill category")
):
    supabase = get_supabase_client()
    builder = supabase.table("skills").select("id, name, category, aliases").order("name")

    if query:
        builder = builder.ilike("name", f"%{query}%")
    if category:
        builder = builder.eq("category", category)

    try:
        res = builder.execute()
        return res.data or []
    except Exception as e:
        from app.core.catalog import load_fallback_skills
        return load_fallback_skills(query=query, category=category)

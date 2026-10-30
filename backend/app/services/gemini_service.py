import logging
import json
import time
from typing import List, Dict, Any, Optional, AsyncGenerator
from app.core.config import settings
from app.core.local_db import (
    get_user_profile,
    get_user_saved_opportunity_ids,
    get_user_applications_list
)
from app.core.database import get_supabase_client
from google import genai
from google.genai import types

from fastapi import HTTPException

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Module-level TTL cache for open opportunities used in system instructions.
# Avoids a live Supabase round-trip on every chat message (~200 ms saved).
# ---------------------------------------------------------------------------
_opp_cache: list = []
_opp_cache_ts: float = 0.0
_OPP_CACHE_TTL: float = 300.0  # 5 minutes


def _get_cached_opportunities() -> list:
    """Returns the cached list of open opportunities, refreshing every 5 minutes."""
    global _opp_cache, _opp_cache_ts
    now = time.monotonic()
    if _opp_cache and (now - _opp_cache_ts) < _OPP_CACHE_TTL:
        return _opp_cache
    try:
        supabase = get_supabase_client()
        opp_res = supabase.table("opportunities").select(
            "id, title, provider, opportunity_type, work_mode, location, "
            "stipend_amount, stipend_type, deadline, official_apply_url"
        ).eq("listing_status", "open").limit(10).execute()
        _opp_cache = opp_res.data or []
        _opp_cache_ts = now
        logger.debug("Opportunities cache refreshed (%d entries)", len(_opp_cache))
    except Exception as e:
        logger.debug("Opportunities cache refresh error: %s", e)
    return _opp_cache


class GeminiService:
    def __init__(self):
        self._client: Optional[genai.Client] = None

    def get_client(self) -> genai.Client:
        """Returns initialized GenAI client or raises error if API key is not configured."""
        api_key = settings.GEMINI_API_KEY.strip() if settings.GEMINI_API_KEY else ""
        if not api_key:
            raise ValueError(
                "Gemini API key is not configured. Please set 'GEMINI_API_KEY' in your backend/.env file."
            )
        return genai.Client(api_key=api_key)

    def build_system_instruction(self, user_id: Optional[str] = None) -> str:
        """
        Builds a comprehensive system instruction covering:
        1. General-purpose technical & conversational expertise (ChatGPT-style capability).
        2. Grounding in the authenticated student's real profile, skills, and Nexus opportunities (when logged in).
        """
        base_prompt = (
            "You are Nexus AI Assistant, an advanced, articulate, and supportive general-purpose AI assistant "
            "and technical mentor embedded inside the Nexus AI career intelligence platform.\n\n"
            "Capabilities & Expertise:\n"
            "- Programming & Engineering: Expert code explanations, debugging, syntax, and architecture across "
            "Python, Java, C, C++, JavaScript, TypeScript, Go, Rust, SQL, HTML/CSS, etc.\n"
            "- DSA & Problem Solving: Data structures, algorithms, asymptotic time/space complexities, recursion, "
            "dynamic programming, graph theory, and step-by-step problem-solving.\n"
            "- AI / ML / GenAI: Machine learning models, deep learning, NLP, computer vision, transformers, embeddings, and prompt engineering.\n"
            "- College & Academics: Computer networks, operating systems, database management systems, discrete mathematics, and software engineering.\n"
            "- Career & Projects: Project ideas, tech stacks, roadmaps, resume feedback, tech interview preparation, and competitive programming.\n"
            "- General Knowledge: General questions, writing assistance, logical explanations, and curiosity.\n\n"
            "Style & Formatting Guidelines:\n"
            "- Format all answers cleanly using GitHub-flavored Markdown.\n"
            "- Use syntax-highlighted code blocks (e.g. ```python, ```cpp, ```javascript) for code snippets.\n"
            "- Use bolding, bulleted lists, and structured sections for readability.\n"
            "- Be concise yet thorough, encouraging, and accurate.\n"
        )

        context_sections = []

        if user_id:
            try:
                # 1. Student profile
                profile = get_user_profile(user_id)
                if profile:
                    student_name = profile.get("display_name") or profile.get("username") or "Student"
                    skills_list = [f"{s['name']} ({s.get('proficiency', 'intermediate')})" for s in (profile.get("skills") or []) if s.get("name")]
                    interests = profile.get("career_interests") or []
                    learning_goals = profile.get("learning_goals") or []

                    context_sections.append(
                        f"\n--- Authenticated Student Profile ---\n"
                        f"Student Name: {student_name}\n"
                        f"Degree & Branch: {profile.get('degree', 'BTech')} in {profile.get('branch', 'Engineering')}\n"
                        f"Academic Year: Year {profile.get('academic_year', 1)} (Graduating {profile.get('graduation_year', 2028)})\n"
                        f"College: {profile.get('college') or 'Not specified'}\n"
                        f"Location: {profile.get('location') or 'Pan-India'}\n"
                        f"Current Skills: {', '.join(skills_list) if skills_list else 'No skills listed yet'}\n"
                        f"Career Interests: {', '.join(interests) if interests else 'General tech'}\n"
                        f"Learning Goals: {', '.join(learning_goals) if learning_goals else 'None specified'}\n"
                    )

                # 2. Saved and Applications
                saved_ids = get_user_saved_opportunity_ids(user_id)
                apps = get_user_applications_list(user_id)
                context_sections.append(
                    f"Saved Opportunities Count: {len(saved_ids)}\n"
                    f"Active Applications Count: {len(apps)}\n"
                )
            except Exception as e:
                logger.debug(f"Assistant profile context assembly note: {e}")

        # 3. Real Opportunities Grounding from Catalog (TTL-cached — no Supabase round-trip per message)
        try:
            cached_opps = _get_cached_opportunities()
            if cached_opps:
                catalog_lines = []
                for opp in cached_opps:
                    stipend_str = f"₹{opp['stipend_amount']}/month" if opp.get("stipend_amount") else "Unpaid / Flexible"
                    catalog_lines.append(
                        f"- {opp['title']} by {opp['provider']} ({opp['opportunity_type']}, {opp['work_mode']}) | "
                        f"Stipend: {stipend_str} | Deadline: {opp.get('deadline') or 'Open'} | URL: {opp['official_apply_url']}"
                    )
                context_sections.append(
                    f"\n--- Live Verified Opportunities in Nexus AI Database ---\n"
                    + "\n".join(catalog_lines)
                    + "\n*CRITICAL RULE*: When referencing opportunities in Nexus AI, use ONLY the verified entries above. "
                    "Never invent companies, internships, deadlines, or application URLs."
                )
        except Exception as e:
            logger.debug("Assistant opportunities grounding note: %s", e)

        if context_sections:
            return base_prompt + "\n" + "\n".join(context_sections)
        return base_prompt

    def format_contents(self, messages: List[Dict[str, str]]) -> List[types.Content]:
        """Converts incoming chat history to official google-genai Content structures."""
        formatted: List[types.Content] = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "").strip()
            if not content:
                continue

            # In GenAI, valid roles are 'user' and 'model'
            genai_role = "model" if role in ("assistant", "model") else "user"
            formatted.append(
                types.Content(
                    role=genai_role,
                    parts=[types.Part.from_text(text=content)]
                )
            )
        return formatted

    async def generate_chat_response(
        self,
        messages: List[Dict[str, str]],
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Asynchronously generates conversational response using Gemini with automatic fallback on 503."""
        client = self.get_client()
        system_instruction = self.build_system_instruction(user_id)
        contents = self.format_contents(messages)

        if not contents:
            raise ValueError("No message content provided for AI Assistant.")

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.7,
            max_output_tokens=2048,
        )

        models_to_try = [settings.GEMINI_MODEL, "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]
        seen = set()
        unique_models = [m for m in models_to_try if not (m in seen or seen.add(m))]

        last_error = None
        for model_name in unique_models:
            try:
                response = await client.aio.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=config
                )
                reply_text = response.text or ""
                return {
                    "role": "assistant",
                    "content": reply_text.strip(),
                    "model": model_name
                }
            except Exception as e:
                last_error = e
                err_msg = str(e)
                if "503" in err_msg or "UNAVAILABLE" in err_msg or "high demand" in err_msg:
                    logger.warning(f"Model {model_name} is experiencing high demand (503), attempting fallback...")
                    continue
                else:
                    raise self._handle_gemini_error(e)

        raise self._handle_gemini_error(last_error)

    async def generate_chat_stream(
        self,
        messages: List[Dict[str, str]],
        user_id: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Streams conversation response chunks formatted as Server-Sent Events (SSE)."""
        client = self.get_client()
        system_instruction = self.build_system_instruction(user_id)
        contents = self.format_contents(messages)

        if not contents:
            yield f"data: {json.dumps({'error': 'No message content provided.'})}\n\n"
            return

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.7,
            max_output_tokens=2048,
        )

        models_to_try = [settings.GEMINI_MODEL, "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]
        seen = set()
        unique_models = [m for m in models_to_try if not (m in seen or seen.add(m))]

        response_stream = None
        active_model = settings.GEMINI_MODEL
        for model_name in unique_models:
            try:
                active_model = model_name
                response_stream = await client.aio.models.generate_content_stream(
                    model=model_name,
                    contents=contents,
                    config=config
                )
                break
            except Exception as e:
                err_msg = str(e)
                if "503" in err_msg or "UNAVAILABLE" in err_msg or "high demand" in err_msg:
                    logger.warning(f"Streaming model {model_name} unavailable (503), trying fallback...")
                    continue
                else:
                    clean_error = str(self._handle_gemini_error(e))
                    yield f"data: {json.dumps({'error': clean_error})}\n\n"
                    return

        if response_stream is None:
            yield f"data: {json.dumps({'error': 'Gemini service is currently unavailable. Please try again shortly.'})}\n\n"
            return

        try:
            async for chunk in response_stream:
                if chunk.text:
                    payload = json.dumps({"text": chunk.text, "model": active_model})
                    yield f"data: {payload}\n\n"

            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as e:
            logger.error(f"Gemini streaming error during iteration: {e}")
            clean_error = str(self._handle_gemini_error(e))
            yield f"data: {json.dumps({'error': clean_error})}\n\n"

    def _handle_gemini_error(self, e: Exception) -> Exception:
        """Translates raw SDK exceptions into clear, friendly error messages with appropriate HTTP status."""
        if isinstance(e, HTTPException):
            return e

        err_str = str(e)
        if "API_KEY_INVALID" in err_str or "invalid api key" in err_str.lower() or ("400" in err_str and "key" in err_str.lower()):
            return HTTPException(
                status_code=401,
                detail="The configured Gemini API key is invalid or unauthorized. Please check GEMINI_API_KEY in backend/.env."
            )
        elif "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
            return HTTPException(
                status_code=429,
                detail="Gemini API rate limit or quota reached. Please wait a moment and try again."
            )
        elif "503" in err_str or "UNAVAILABLE" in err_str or "high demand" in err_str:
            return HTTPException(
                status_code=503,
                detail="Google Gemini AI service is momentarily experiencing high demand. Please try again in a few seconds."
            )
        elif "404" in err_str and "model" in err_str.lower():
            return HTTPException(
                status_code=404,
                detail=f"The configured model '{settings.GEMINI_MODEL}' is not accessible. Please check GEMINI_MODEL in backend/.env."
            )
        return HTTPException(status_code=500, detail=f"Gemini AI Assistant error: {err_str}")


gemini_service = GeminiService()

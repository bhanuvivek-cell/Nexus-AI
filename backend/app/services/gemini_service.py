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
        self._clients: Dict[str, genai.Client] = {}
        self._key_index: int = 0
        self._key_cooldowns: Dict[str, float] = {}

    def get_configured_keys(self) -> List[str]:
        """Returns all configured Gemini API keys."""
        return settings.gemini_keys

    def get_available_keys(self) -> List[str]:
        """
        Returns configured API keys ordered by round-robin rotation,
        prioritizing keys that are not currently on cooldown.
        """
        all_keys = self.get_configured_keys()
        if not all_keys:
            return []

        now = time.monotonic()
        # Clean up expired cooldowns
        expired = [k for k, expire_time in self._key_cooldowns.items() if now >= expire_time]
        for k in expired:
            self._key_cooldowns.pop(k, None)

        # Rotate list starting from current round-robin index
        idx = self._key_index % len(all_keys)
        rotated = all_keys[idx:] + all_keys[:idx]

        # Prioritize active keys over cooled-down ones
        active = [k for k in rotated if k not in self._key_cooldowns]
        cooled = [k for k in rotated if k in self._key_cooldowns]
        return active if active else cooled

    def mark_key_rate_limited(self, api_key: str, cooldown_seconds: float = 8.0):
        """Marks an API key on cooldown due to rate limiting or temporary quota exhaustion."""
        self._key_cooldowns[api_key] = time.monotonic() + cooldown_seconds
        masked = f"...{api_key[-6:]}" if len(api_key) > 6 else "***"
        logger.warning(
            "Gemini API key %s temporarily rate-limited; placed on cooldown for %ss.",
            masked,
            cooldown_seconds
        )

    def advance_key(self):
        """Advances round-robin pointer to distribute load across keys."""
        keys = self.get_configured_keys()
        if keys:
            self._key_index = (self._key_index + 1) % len(keys)

    def get_client(self, api_key: Optional[str] = None) -> genai.Client:
        """Returns initialized GenAI client for the given key or next available rotated key."""
        target_key = api_key
        if not target_key:
            available = self.get_available_keys()
            if not available:
                raise ValueError(
                    "Gemini API key is not configured. Please set 'GEMINI_API_KEY' or 'GEMINI_API_KEYS' in your backend/.env file."
                )
            target_key = available[0]

        if target_key not in self._clients:
            self._clients[target_key] = genai.Client(api_key=target_key)
        return self._clients[target_key]

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
        """Asynchronously generates conversational response using Gemini with automatic key rotation and model fallback."""
        keys = self.get_available_keys()
        if not keys:
            raise ValueError(
                "Gemini API key is not configured. Please set 'GEMINI_API_KEY' or 'GEMINI_API_KEYS' in your backend/.env file."
            )

        system_instruction = self.build_system_instruction(user_id)
        contents = self.format_contents(messages)

        if not contents:
            raise ValueError("No message content provided for AI Assistant.")

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.7,
            max_output_tokens=2048,
        )

        models_to_try = [settings.GEMINI_MODEL, "gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-1.5-flash"]
        seen = set()
        unique_models = [m for m in models_to_try if not (m in seen or seen.add(m))]

        last_error = None
        for api_key in keys:
            client = self.get_client(api_key)
            masked = f"...{api_key[-6:]}" if len(api_key) > 6 else "***"
            rotate_to_next_key = False

            for model_name in unique_models:
                try:
                    response = await client.aio.models.generate_content(
                        model=model_name,
                        contents=contents,
                        config=config
                    )
                    reply_text = response.text or ""
                    # On successful response, advance round-robin pointer for next call
                    self.advance_key()
                    return {
                        "role": "assistant",
                        "content": reply_text.strip(),
                        "model": model_name
                    }
                except Exception as e:
                    last_error = e
                    err_msg = str(e)
                    # Detect rate limits (429 / RESOURCE_EXHAUSTED / quota) or invalid key
                    if any(term in err_msg.lower() for term in ["429", "resource_exhausted", "quota", "rate limit"]):
                        logger.warning(
                            "Key %s hit rate limit or quota (%s). Placing on cooldown and rotating to next key...",
                            masked, e
                        )
                        self.mark_key_rate_limited(api_key, cooldown_seconds=8.0)
                        rotate_to_next_key = True
                        break
                    elif "api_key_invalid" in err_msg.lower() or ("400" in err_msg and "key" in err_msg.lower()) or "403" in err_msg or "permission_denied" in err_msg.lower() or "billing" in err_msg.lower() or "project-unavailable" in err_msg.lower():
                        logger.warning("Key %s is invalid or lacks billing/permission (403). Placing on cooldown and rotating...", masked)
                        self.mark_key_rate_limited(api_key, cooldown_seconds=3600.0)
                        rotate_to_next_key = True
                        break
                    elif "503" in err_msg or "unavailable" in err_msg.lower() or "high demand" in err_msg.lower():
                        logger.warning(
                            "Model %s with key %s experiencing high demand (503), attempting fallback model...",
                            model_name, masked
                        )
                        continue
                    else:
                        raise self._handle_gemini_error(e)

            if not rotate_to_next_key and len(keys) > 1:
                logger.warning("All models busy with key %s; attempting next rotated key...", masked)

        raise self._handle_gemini_error(last_error)

    async def generate_chat_stream(
        self,
        messages: List[Dict[str, str]],
        user_id: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Streams conversation response chunks formatted as Server-Sent Events (SSE) with key rotation."""
        keys = self.get_available_keys()
        if not keys:
            yield f"data: {json.dumps({'error': 'No Gemini API keys are configured.'})}\n\n"
            return

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

        models_to_try = [settings.GEMINI_MODEL, "gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-1.5-flash"]
        seen = set()
        unique_models = [m for m in models_to_try if not (m in seen or seen.add(m))]

        response_stream = None
        active_model = settings.GEMINI_MODEL

        for api_key in keys:
            client = self.get_client(api_key)
            masked = f"...{api_key[-6:]}" if len(api_key) > 6 else "***"

            for model_name in unique_models:
                try:
                    active_model = model_name
                    response_stream = await client.aio.models.generate_content_stream(
                        model=model_name,
                        contents=contents,
                        config=config
                    )
                    self.advance_key()
                    break
                except Exception as e:
                    err_msg = str(e)
                    if any(term in err_msg.lower() for term in ["429", "resource_exhausted", "quota", "rate limit"]):
                        logger.warning(
                            "Key %s hit rate limit during stream setup. Rotating to next key...", masked
                        )
                        self.mark_key_rate_limited(api_key, cooldown_seconds=8.0)
                        break
                    elif "api_key_invalid" in err_msg.lower() or ("400" in err_msg and "key" in err_msg.lower()) or "403" in err_msg or "permission_denied" in err_msg.lower() or "billing" in err_msg.lower() or "project-unavailable" in err_msg.lower():
                        logger.warning("Key %s is invalid or lacks billing/permission (403) during stream. Rotating...", masked)
                        self.mark_key_rate_limited(api_key, cooldown_seconds=3600.0)
                        break
                    elif "503" in err_msg or "unavailable" in err_msg.lower() or "high demand" in err_msg.lower():
                        logger.warning("Streaming model %s unavailable (503), trying fallback...", model_name)
                        continue
                    else:
                        clean_error = str(self._handle_gemini_error(e))
                        yield f"data: {json.dumps({'error': clean_error})}\n\n"
                        return

            if response_stream is not None:
                break

        if response_stream is None:
            yield f"data: {json.dumps({'error': 'Gemini service is currently unavailable across all configured API keys and models. Please try again shortly.'})}\n\n"
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
        key_count = len(self.get_configured_keys())
        suffix = f" (across {key_count} configured key{'s' if key_count > 1 else ''})" if key_count > 1 else ""

        if "API_KEY_INVALID" in err_str or "invalid api key" in err_str.lower() or ("400" in err_str and "key" in err_str.lower()):
            return HTTPException(
                status_code=401,
                detail="The configured Gemini API key is invalid or unauthorized. Please check GEMINI_API_KEY or GEMINI_API_KEYS in backend/.env."
            )
        elif "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "quota" in err_str.lower():
            return HTTPException(
                status_code=429,
                detail=f"Gemini API rate limit or quota reached{suffix}. Please wait a moment or add additional keys to GEMINI_API_KEYS for rotation."
            )
        elif "503" in err_str or "UNAVAILABLE" in err_str or "high demand" in err_str.lower():
            return HTTPException(
                status_code=503,
                detail=f"Google Gemini AI service is momentarily experiencing high demand{suffix}. Please try again in a few seconds."
            )
        elif "404" in err_str and "model" in err_str.lower():
            return HTTPException(
                status_code=404,
                detail=f"The configured model '{settings.GEMINI_MODEL}' is not accessible. Please check GEMINI_MODEL in backend/.env."
            )
        return HTTPException(status_code=500, detail=f"Gemini AI Assistant error: {err_str}")



gemini_service = GeminiService()

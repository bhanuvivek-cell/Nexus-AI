from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from app.core.security import get_optional_user, AuthenticatedUser
from app.core.config import settings
from app.services.gemini_service import gemini_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class ChatMessageSchema(BaseModel):
    role: str = Field(..., description="Role: 'user', 'assistant', or 'model'")
    content: str = Field(..., min_length=1, description="Message text content")


class ChatRequestSchema(BaseModel):
    messages: List[ChatMessageSchema] = Field(..., min_length=1)
    stream: bool = Field(default=False, description="Whether to stream response tokens via SSE")


class ChatResponseSchema(BaseModel):
    role: str = "assistant"
    content: str
    model: str


class AssistantStatusSchema(BaseModel):
    configured: bool
    model: str
    service: str = "Google Gemini AI"
    key_count: int = 0
    rotation_enabled: bool = False


@router.get("/status", response_model=AssistantStatusSchema, summary="Check Gemini AI Assistant availability")
async def get_assistant_status():
    """Returns whether Gemini API is configured, key count, and rotation status without exposing secrets."""
    keys = settings.gemini_keys
    return AssistantStatusSchema(
        configured=len(keys) > 0,
        model=settings.GEMINI_MODEL,
        key_count=len(keys),
        rotation_enabled=len(keys) > 1
    )


@router.post("/chat", summary="Chat with Nexus AI Assistant powered by Google Gemini")
async def chat_with_assistant(
    req: ChatRequestSchema,
    user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    """
    Conversational general-purpose AI chatbot powered by Google Gemini.
    - Answers general knowledge, programming, DSA, system design, math, and project questions.
    - Grounded in student profile and verified Nexus AI opportunities when available.
    - Supports both streaming (Server-Sent Events) and JSON responses.
    """
    user_id = user.id if user else None
    messages_dict = [{"role": m.role, "content": m.content} for m in req.messages]

    # Trim to last 12 messages to keep prompt size and latency bounded.
    # The full history is displayed in the UI; only recent context is needed
    # for Gemini to maintain conversational coherence.
    if len(messages_dict) > 12:
        messages_dict = messages_dict[-12:]

    if req.stream:
        try:
            # Verify client exists before starting stream
            gemini_service.get_client()
        except ValueError as ve:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(ve))

        generator = gemini_service.generate_chat_stream(messages_dict, user_id=user_id)
        return StreamingResponse(
            generator,
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )

    try:
        res = await gemini_service.generate_chat_response(messages_dict, user_id=user_id)
        return ChatResponseSchema(
            role=res["role"],
            content=res["content"],
            model=res["model"]
        )
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(ve))
    except Exception as e:
        logger.error(f"Error in chat_with_assistant: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

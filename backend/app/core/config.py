from pathlib import Path
from typing import List, Union, Any
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
import json

_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=[str(_BACKEND_DIR / ".env"), ".env"],
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"
    )

    PROJECT_NAME: str = "Nexus AI Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Supabase Configuration
    SUPABASE_URL: str = Field(
        default="https://vhjtiiyzajoxmadokkcp.supabase.co",
        description="Supabase Project URL"
    )
    SUPABASE_ANON_KEY: str = Field(
        default="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoanRpaXl6YWpveG1hZG9ra2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0MDk3OTMsImV4cCI6MjEwMjk4NTc5M30.u0obwU6aiame0TTTQidyRybaKNWa1idXmZR2LztfKH8",
        description="Supabase Anonymous/Public Key"
    )
    SUPABASE_SERVICE_ROLE_KEY: str = Field(
        default="",
        description="Supabase Service Role Key for elevated backend tasks"
    )
    SUPABASE_JWT_SECRET: str = Field(
        default="",
        description="Supabase JWT secret for offline signature verification"
    )
    JWT_SECRET: str = Field(
        default="nexus-ai-secure-signing-key-for-jwt-tokens-production-grade-32bytes",
        description="Secret key for backend-issued JWT authentication tokens"
    )
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_DAYS: int = 30
    
    # Gemini AI Assistant
    GEMINI_API_KEY: str = Field(
        default="",
        description="Google Gemini API Key for Nexus AI Assistant"
    )
    GEMINI_MODEL: str = Field(
        default="gemini-3.1-flash-lite",
        description="Gemini Model Identifier"
    )
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            v_trimmed = v.strip()
            if v_trimmed.startswith("[") and v_trimmed.endswith("]"):
                try:
                    return json.loads(v_trimmed)
                except Exception:
                    pass
            return [i.strip() for i in v_trimmed.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
        ]
    
    # AI/ML Configuration
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_DIM: int = 384


settings = Settings()

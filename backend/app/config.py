import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "CallSight Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "callsight-insecure-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./callsight.db")
    
    # Gnani AI Prisma STT Configuration
    GNANI_API_KEY: str = os.getenv("GNANI_API_KEY", "")
    GNANI_STT_WS_URL: str = os.getenv("GNANI_STT_WS_URL", "wss://api.vachana.ai/stt/v3/stream")
    GNANI_MODEL: str = os.getenv("GNANI_MODEL", "prisma-v2.5")
    GNANI_SAMPLE_RATE: int = 16000
    GNANI_ENCODING: str = "signed-pcm"
    GNANI_CHANNELS: int = 1
    
    # Pacing and frame size (1024 bytes = 512 samples = 32ms at 16kHz 16-bit)
    AUDIO_FRAME_CHUNK_SIZE: int = 1024

settings = Settings()

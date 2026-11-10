from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class CallInitiateRequest(BaseModel):
    callee_id: str

class CallConsentRequest(BaseModel):
    consent: bool

class SmartHighlightSchema(BaseModel):
    id: Optional[str] = None
    highlight_type: str  # date_time, question, number, action_item, name
    text: str
    context: Optional[str] = None

class TranscriptItemSchema(BaseModel):
    id: Optional[str] = None
    speaker_id: str
    speaker_name: str
    text: str
    confidence: float = 1.0
    timestamp_ms: int
    is_final: bool = True
    highlights: Optional[List[SmartHighlightSchema]] = None

class CallRecordResponse(BaseModel):
    id: str
    caller_id: str
    caller_name: Optional[str] = None
    callee_id: str
    callee_name: Optional[str] = None
    status: str
    duration_seconds: int
    has_transcript: bool
    started_at: datetime
    ended_at: Optional[datetime] = None

class CallTranscriptResponse(BaseModel):
    call_id: str
    items: List[TranscriptItemSchema]
    highlights: List[SmartHighlightSchema]
    messages: List[dict]

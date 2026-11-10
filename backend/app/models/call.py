from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey
from datetime import datetime
import uuid
from ..database import Base

class CallRecord(Base):
    __tablename__ = "call_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    caller_id = Column(String, ForeignKey("users.id"), nullable=False)
    callee_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="completed")  # "missed", "completed", "declined"
    duration_seconds = Column(Integer, default=0)
    has_transcript = Column(Boolean, default=False)
    caller_consent = Column(Boolean, default=False)
    callee_consent = Column(Boolean, default=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)

class TranscriptItem(Base):
    __tablename__ = "transcript_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    call_id = Column(String, ForeignKey("call_records.id"), nullable=False, index=True)
    speaker_id = Column(String, ForeignKey("users.id"), nullable=False)
    speaker_name = Column(String, nullable=False)
    text = Column(String, nullable=False)
    confidence = Column(String, default="1.0")
    timestamp_ms = Column(Integer, nullable=False)
    is_final = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class SmartHighlight(Base):
    __tablename__ = "smart_highlights"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    call_id = Column(String, ForeignKey("call_records.id"), nullable=False, index=True)
    highlight_type = Column(String, nullable=False)  # "date_time", "question", "number", "action_item", "name"
    text = Column(String, nullable=False)
    context = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class TextMessage(Base):
    __tablename__ = "text_messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    call_id = Column(String, ForeignKey("call_records.id"), nullable=False, index=True)
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    sender_name = Column(String, nullable=False)
    content = Column(String, nullable=False)
    is_voice_spoken = Column(Boolean, default=False)
    sent_at = Column(DateTime, default=datetime.utcnow)

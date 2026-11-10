from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models.call import CallRecord, TranscriptItem, SmartHighlight, TextMessage
from ..models.user import User
from ..schemas.schemas import (
    CallRecordResponse, CallInitiateRequest, CallConsentRequest,
    CallTranscriptResponse, TranscriptItemSchema, SmartHighlightSchema
)

router = APIRouter(prefix="/calls", tags=["calls"])

@router.post("/initiate")
def initiate_call(req: CallInitiateRequest, user_id: str, db: Session = Depends(get_db)):
    callee = db.query(User).filter(User.id == req.callee_id).first()
    if not callee:
        raise HTTPException(status_code=404, detail="Callee user not found")

    call = CallRecord(
        caller_id=user_id,
        callee_id=req.callee_id,
        status="initiating",
        started_at=datetime.utcnow()
    )
    db.add(call)
    db.commit()
    db.refresh(call)
    return {"call_id": call.id, "status": call.status}

@router.get("/history", response_model=List[CallRecordResponse])
def get_call_history(user_id: str, db: Session = Depends(get_db)):
    records = db.query(CallRecord).filter(
        (CallRecord.caller_id == user_id) | (CallRecord.callee_id == user_id)
    ).order_by(CallRecord.started_at.desc()).limit(50).all()

    result = []
    for r in records:
        caller = db.query(User).filter(User.id == r.caller_id).first()
        callee = db.query(User).filter(User.id == r.callee_id).first()
        result.append(CallRecordResponse(
            id=r.id,
            caller_id=r.caller_id,
            caller_name=caller.name if caller else "Unknown",
            callee_id=r.callee_id,
            callee_name=callee.name if callee else "Unknown",
            status=r.status,
            duration_seconds=r.duration_seconds,
            has_transcript=r.has_transcript,
            started_at=r.started_at,
            ended_at=r.ended_at
        ))
    return result

@router.post("/{call_id}/consent")
def update_consent(call_id: str, req: CallConsentRequest, user_id: str, db: Session = Depends(get_db)):
    call = db.query(CallRecord).filter(CallRecord.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    if call.caller_id == user_id:
        call.caller_consent = req.consent
    elif call.callee_id == user_id:
        call.callee_consent = req.consent

    db.commit()
    # Mutual consent status
    is_active = call.caller_consent and call.callee_consent
    return {"call_id": call_id, "mutual_consent": is_active}

@router.get("/{call_id}/transcript", response_model=CallTranscriptResponse)
def get_transcript(call_id: str, db: Session = Depends(get_db)):
    call = db.query(CallRecord).filter(CallRecord.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")

    items = db.query(TranscriptItem).filter(TranscriptItem.call_id == call_id).order_by(TranscriptItem.timestamp_ms).all()
    highlights = db.query(SmartHighlight).filter(SmartHighlight.call_id == call_id).all()
    messages = db.query(TextMessage).filter(TextMessage.call_id == call_id).order_by(TextMessage.sent_at).all()

    return CallTranscriptResponse(
        call_id=call_id,
        items=[
            TranscriptItemSchema(
                id=i.id,
                speaker_id=i.speaker_id,
                speaker_name=i.speaker_name,
                text=i.text,
                confidence=float(i.confidence),
                timestamp_ms=i.timestamp_ms,
                is_final=i.is_final
            ) for i in items
        ],
        highlights=[
            SmartHighlightSchema(
                id=h.id,
                highlight_type=h.highlight_type,
                text=h.text,
                context=h.context
            ) for h in highlights
        ],
        messages=[
            {
                "id": m.id,
                "sender_id": m.sender_id,
                "sender_name": m.sender_name,
                "content": m.content,
                "sent_at": m.sent_at.isoformat()
            } for m in messages
        ]
    )

@router.delete("/{call_id}/transcript")
def delete_transcript(call_id: str, db: Session = Depends(get_db)):
    call = db.query(CallRecord).filter(CallRecord.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")

    db.query(TranscriptItem).filter(TranscriptItem.call_id == call_id).delete()
    db.query(SmartHighlight).filter(SmartHighlight.call_id == call_id).delete()
    call.has_transcript = False
    db.commit()
    return {"status": "deleted", "call_id": call_id}

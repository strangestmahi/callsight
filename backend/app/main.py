import json
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base, get_db
from .routers import auth, users, calls
from .services.connection_manager import manager
from .services.gnani_stt import GnaniPrismaStreamingClient
from .services.smart_highlights import SmartHighlightsEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("callsight.server")

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="CallSight AI-Powered Live Call Transcription and Silent Communication"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(calls.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "app": "CallSight API",
        "status": "online",
        "gnani_configured": bool(settings.GNANI_API_KEY)
    }

@app.websocket("/ws/signaling")
async def signaling_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect_user(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            await manager.handle_signaling_message(user_id, payload)
    except WebSocketDisconnect:
        manager.disconnect_user(user_id)
    except Exception as e:
        logger.error(f"Signaling error for {user_id}: {e}")
        manager.disconnect_user(user_id)

@app.websocket("/ws/calls/{call_id}/audio-stt")
async def audio_stt_endpoint(websocket: WebSocket, call_id: str, speaker_id: str, speaker_name: str = "Caller"):
    """
    Receives raw 16 kHz mono signed 16-bit PCM frames from remote participant's audio track.
    Streams to Gnani Prisma STT (wss://api.vachana.ai/stt/v3/stream) or triggers test captions.
    Broadcasts interim/final text and smart highlights to listening client.
    """
    await websocket.accept()
    gnani_client = GnaniPrismaStreamingClient()
    connected_to_gnani = await gnani_client.connect()

    async def forward_gnani_events():
        async for event in gnani_client.listen_transcripts():
            text = event["text"]
            is_final = event["is_final"]
            highlights = []
            if is_final:
                highlights = SmartHighlightsEngine.extract_from_text(text)

            await websocket.send_text(json.dumps({
                "event": "transcript",
                "call_id": call_id,
                "speaker_id": speaker_id,
                "speaker_name": speaker_name,
                "text": text,
                "is_final": is_final,
                "confidence": event.get("confidence", 0.95),
                "highlights": highlights
            }))

    if connected_to_gnani:
        import asyncio
        asyncio.create_task(forward_gnani_events())

    try:
        while True:
            # Receive binary PCM audio frame (1024 bytes)
            pcm_data = await websocket.receive_bytes()
            if connected_to_gnani:
                await gnani_client.send_audio_chunk(pcm_data)
            else:
                # Echo receipt confirmation for testing
                pass
    except WebSocketDisconnect:
        logger.info(f"Audio STT stream disconnected for call {call_id}")
    finally:
        await gnani_client.close()

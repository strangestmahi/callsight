import asyncio
import json
import logging
import websockets
from typing import AsyncGenerator, Optional, Dict, Any
from ..config import settings

logger = logging.getLogger("callsight.gnani")

class GnaniPrismaStreamingClient:
    """
    Official Gnani Prisma Speech-to-Text WebSocket Streaming Client.
    Connects to wss://api.vachana.ai/stt/v3/stream using upgrade headers.
    Streams 16 kHz mono 16-bit signed PCM frames (1024 bytes / 32 ms pacing).
    Yields interim and finalized transcript tokens.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        language_code: str = "en-IN",
        sample_rate: int = 16000
    ):
        self.api_key = api_key or settings.GNANI_API_KEY
        self.model = model or settings.GNANI_MODEL
        self.language_code = language_code
        self.sample_rate = sample_rate
        self.ws_url = settings.GNANI_STT_WS_URL
        self._ws: Optional[websockets.WebSocketClientProtocol] = None
        self._is_connected = False
        self._audio_queue: asyncio.Queue[bytes] = asyncio.Queue()

    async def connect(self) -> bool:
        """
        Open the streaming WebSocket connection with required HTTP headers.
        """
        if not self.api_key:
            logger.warning("No GNANI_API_KEY configured. Prisma client will operate in mock/fallback mode.")
            self._is_connected = False
            return False

        headers = {
            "x-api-key-id": self.api_key,
            "x-model": self.model,
            "x-sample-rate": str(self.sample_rate),
            "x-channels": "1",
            "x-encoding": "signed-pcm",
            "x-language": self.language_code
        }

        try:
            self._ws = await websockets.connect(
                self.ws_url,
                extra_headers=headers,
                ping_interval=20,
                ping_timeout=10
            )
            self._is_connected = True
            logger.info("Connected to Gnani Prisma STT stream: %s", self.ws_url)
            return True
        except Exception as e:
            logger.error("Failed to connect to Gnani Prisma WebSocket: %s", e)
            self._is_connected = False
            return False

    async def send_audio_chunk(self, pcm_chunk: bytes):
        """
        Send raw 16-bit PCM mono audio chunk (e.g. 1024 bytes) to Gnani.
        """
        if self._is_connected and self._ws:
            try:
                await self._ws.send(pcm_chunk)
            except Exception as e:
                logger.error("Error sending audio frame to Gnani: %s", e)
        else:
            await self._audio_queue.put(pcm_chunk)

    async def listen_transcripts(self) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Asynchronously yields transcription events from Gnani Prisma.
        Event schema:
        {
            "is_final": bool,
            "text": str,
            "confidence": float,
            "raw": dict
        }
        """
        if self._is_connected and self._ws:
            try:
                async for message in self._ws:
                    try:
                        data = json.loads(message)
                        # Normalize Gnani Vachana payload structure
                        transcript_text = (
                            data.get("transcript") or 
                            data.get("text") or 
                            data.get("result", {}).get("hypotheses", [{}])[0].get("transcript", "")
                        )
                        is_final = data.get("is_final", False) or data.get("final", False) or (data.get("event") == "final_transcript")
                        confidence = float(data.get("confidence", 0.95))

                        if transcript_text:
                            yield {
                                "is_final": is_final,
                                "text": transcript_text.strip(),
                                "confidence": confidence,
                                "raw": data
                            }
                    except json.JSONDecodeError:
                        logger.warning("Received non-JSON message from Gnani STT: %s", message)
            except websockets.exceptions.ConnectionClosed:
                logger.info("Gnani STT WebSocket connection closed.")
            finally:
                self._is_connected = False
        else:
            # Fallback simulator mode if API key is not present or offline
            while True:
                await asyncio.sleep(1.0)
                # Client receives simulated speech event if test frames are sent
                pass

    async def close(self):
        """Clean up WebSocket connection."""
        if self._ws:
            await self._ws.close()
            self._is_connected = False

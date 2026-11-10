import json
import logging
from typing import Dict, Any, Optional
from fastapi import WebSocket

logger = logging.getLogger("callsight.signaling")

class ConnectionManager:
    """
    Manages active user WebSocket connections, call signaling states,
    SDP offers/answers, ICE candidates, and in-call text messages.
    """

    def __init__(self):
        # user_id -> WebSocket
        self.active_users: Dict[str, WebSocket] = {}
        # call_id -> dict of call session state
        self.active_calls: Dict[str, Dict[str, Any]] = {}

    async def connect_user(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_users[user_id] = websocket
        logger.info(f"User {user_id} connected to signaling.")

    def disconnect_user(self, user_id: str):
        if user_id in self.active_users:
            del self.active_users[user_id]
            logger.info(f"User {user_id} disconnected.")

    async def send_to_user(self, user_id: str, message: Dict[str, Any]) -> bool:
        ws = self.active_users.get(user_id)
        if ws:
            try:
                await ws.send_text(json.dumps(message))
                return True
            except Exception as e:
                logger.error(f"Failed to send message to user {user_id}: {e}")
                self.disconnect_user(user_id)
        return False

    async def handle_signaling_message(self, sender_id: str, payload: Dict[str, Any]):
        msg_type = payload.get("type")
        call_id = payload.get("call_id")

        if msg_type == "call_invitation":
            callee_id = payload.get("callee_id")
            if callee_id:
                await self.send_to_user(callee_id, {
                    "type": "call_invitation",
                    "call_id": call_id,
                    "caller_id": sender_id,
                    "caller_name": payload.get("caller_name", "Caller"),
                    "created_at": payload.get("created_at")
                })

        elif msg_type == "call_accepted":
            caller_id = payload.get("caller_id")
            if caller_id:
                await self.send_to_user(caller_id, {
                    "type": "call_accepted",
                    "call_id": call_id,
                    "callee_id": sender_id
                })

        elif msg_type == "call_declined":
            caller_id = payload.get("caller_id")
            if caller_id:
                await self.send_to_user(caller_id, {
                    "type": "call_declined",
                    "call_id": call_id,
                    "reason": payload.get("reason", "declined")
                })

        elif msg_type == "call_ended":
            target_id = payload.get("target_id")
            if target_id:
                await self.send_to_user(target_id, {
                    "type": "call_ended",
                    "call_id": call_id,
                    "reason": payload.get("reason", "ended")
                })

        elif msg_type in ("webrtc_offer", "webrtc_answer", "ice_candidate"):
            target_id = payload.get("target_id")
            if target_id:
                forward_payload = dict(payload)
                forward_payload["from_user_id"] = sender_id
                await self.send_to_user(target_id, forward_payload)

        elif msg_type == "text_message":
            target_id = payload.get("target_id")
            if target_id:
                await self.send_to_user(target_id, {
                    "type": "text_message",
                    "call_id": call_id,
                    "sender_id": sender_id,
                    "sender_name": payload.get("sender_name", "User"),
                    "content": payload.get("content", ""),
                    "timestamp": payload.get("timestamp"),
                    "is_voice_spoken": payload.get("is_voice_spoken", False)
                })

manager = ConnectionManager()

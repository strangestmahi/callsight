package com.callsight.app.data.model

data class User(
    val id: String,
    val name: String,
    val email: String,
    val avatarUrl: String? = null
)

data class AuthResponse(
    val accessToken: String,
    val tokenType: String,
    val user: User
)

data class CallSession(
    val id: String,
    val callerId: String,
    val callerName: String,
    val calleeId: String,
    val calleeName: String,
    val status: String,
    val durationSeconds: Int = 0,
    val hasTranscript: Boolean = false,
    val isSilentMode: Boolean = false,
    val mutualConsent: Boolean = false
)

data class TranscriptItem(
    val id: String = "",
    val speakerId: String,
    val speakerName: String,
    val text: String,
    val timestampMs: Long,
    val isFinal: Boolean,
    val confidence: Float = 1.0f,
    val highlights: List<SmartHighlight> = emptyList()
)

data class SmartHighlight(
    val id: String = "",
    val highlightType: String, // "date_time", "question", "number", "action_item"
    val text: String,
    val context: String? = null
)

data class ChatMessage(
    val id: String = "",
    val senderId: String,
    val senderName: String,
    val content: String,
    val timestamp: Long = System.currentTimeMillis()
)

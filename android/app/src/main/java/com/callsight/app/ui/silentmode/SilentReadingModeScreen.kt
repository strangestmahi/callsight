package com.callsight.app.ui.silentmode

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.callsight.app.data.model.ChatMessage
import com.callsight.app.data.model.SmartHighlight
import com.callsight.app.data.model.TranscriptItem
import com.callsight.app.ui.theme.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SilentReadingModeScreen(
    callerName: String,
    callDuration: String,
    isTranscriptionPaused: Boolean,
    transcriptItems: List<TranscriptItem>,
    interimText: String?,
    smartHighlights: List<SmartHighlight>,
    chatMessages: List<ChatMessage>,
    onTogglePause: () -> Unit,
    onSendTextMessage: (String) -> Unit,
    onEndCall: () -> Unit,
    onBackToCall: () -> Unit
) {
    var textInput by remember { mutableStateOf("") }
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()
    var showHighlightsSheet by remember { mutableStateOf(false) }

    // Auto-scroll to bottom when new transcripts or messages arrive
    LaunchedEffect(transcriptItems.size, interimText, chatMessages.size) {
        if (transcriptItems.isNotEmpty() || chatMessages.isNotEmpty()) {
            val totalCount = transcriptItems.size + chatMessages.size + (if (interimText != null) 1 else 0)
            listState.animateScrollToItem((totalCount - 1).coerceAtLeast(0))
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Silent Reading Mode",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            // Status indicator badge
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (isTranscriptionPaused) Color(0xFFF59E0B) else TealAccent)
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = if (isTranscriptionPaused) "PAUSED" else "LIVE CAPTIONS",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.Black
                                )
                            }
                        }
                        Text(
                            text = "$callerName • $callDuration",
                            fontSize = 12.sp,
                            color = TextSecondary
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackToCall) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = TextPrimary)
                    }
                },
                actions = {
                    // Highlights badge action
                    IconButton(onClick = { showHighlightsSheet = !showHighlightsSheet }) {
                        BadgedBox(
                            badge = {
                                if (smartHighlights.isNotEmpty()) {
                                    Badge(containerColor = TealAccent, contentColor = Color.Black) {
                                        Text("${smartHighlights.size}")
                                    }
                                }
                            }
                        ) {
                            Icon(Icons.Default.AutoAwesome, contentDescription = "Highlights", tint = TealAccent)
                        }
                    }
                    // Pause/Resume Transcription
                    IconButton(onClick = onTogglePause) {
                        Icon(
                            if (isTranscriptionPaused) Icons.Default.PlayArrow else Icons.Default.Pause,
                            contentDescription = if (isTranscriptionPaused) "Resume STT" else "Pause STT",
                            tint = if (isTranscriptionPaused) Color(0xFFF59E0B) else TextPrimary
                        )
                    }
                    // End Call
                    IconButton(onClick = onEndCall) {
                        Icon(Icons.Default.CallEnd, contentDescription = "End Call", tint = ErrorRed)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DeepSurface)
            )
        },
        containerColor = DarkNavyBackground
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Highlights quick preview chip bar if highlights present
            if (smartHighlights.isNotEmpty()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(DeepSurface)
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.Lightbulb,
                        contentDescription = "Insight",
                        tint = TealAccent,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Recent Insight: ${smartHighlights.last().text}",
                        fontSize = 12.sp,
                        color = TealAccent,
                        maxLines = 1
                    )
                }
            }

            // Main Conversation Stream (Captions & Silent Chat Replies)
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            ) {
                items(transcriptItems) { item ->
                    TranscriptBubble(item = item)
                    Spacer(modifier = Modifier.height(10.dp))
                }

                // Interim Speech Bubble (Live, streaming, italics, glowing border)
                if (!interimText.isNullOrBlank() && !isTranscriptionPaused) {
                    item {
                        InterimTranscriptBubble(speakerName = callerName, text = interimText)
                        Spacer(modifier = Modifier.height(10.dp))
                    }
                }

                // In-Call Chat Messages sent by the user
                items(chatMessages) { msg ->
                    ChatBubble(message = msg)
                    Spacer(modifier = Modifier.height(10.dp))
                }
            }

            // Suggested Quick Actions / Replies
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                QuickReplyChip("I'm listening via captions") { onSendTextMessage(it) }
                QuickReplyChip("Could you repeat that?") { onSendTextMessage(it) }
                QuickReplyChip("Understood, thank you") { onSendTextMessage(it) }
            }

            // Bottom Text Reply Field & Send Button
            Surface(
                color = DeepSurface,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextField(
                        value = textInput,
                        onValueChange = { textInput = it },
                        placeholder = { Text("Type silent reply...", color = TextSecondary) },
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(24.dp)),
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = SurfaceCard,
                            unfocusedContainerColor = SurfaceCard,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary,
                            focusedIndicatorColor = Color.Transparent,
                            unfocusedIndicatorColor = Color.Transparent
                        ),
                        maxLines = 3
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    IconButton(
                        onClick = {
                            if (textInput.isNotBlank()) {
                                onSendTextMessage(textInput.trim())
                                textInput = ""
                            }
                        },
                        modifier = Modifier
                            .clip(RoundedCornerShape(24.dp))
                            .background(TealAccent)
                    ) {
                        Icon(Icons.Default.Send, contentDescription = "Send", tint = Color.Black)
                    }
                }
            }
        }
    }
}

@Composable
fun TranscriptBubble(item: TranscriptItem) {
    val timeFormat = remember { SimpleDateFormat("HH:mm:ss", Locale.getDefault()) }
    val formattedTime = timeFormat.format(Date(item.timestampMs))

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(topStart = 4.dp, topEnd = 16.dp, bottomEnd = 16.dp, bottomStart = 16.dp))
            .background(SurfaceCard)
            .padding(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = item.speakerName,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = TealAccent
            )
            Text(
                text = formattedTime,
                fontSize = 10.sp,
                color = TextSecondary
            )
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = item.text,
            fontSize = 15.sp,
            color = TextPrimary,
            lineHeight = 22.sp
        )

        // Highlights associated with this sentence
        if (item.highlights.isNotEmpty()) {
            Spacer(modifier = Modifier.height(6.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                item.highlights.forEach { h ->
                    AssistChip(
                        onClick = {},
                        label = { Text("${h.highlightType}: ${h.text}", fontSize = 11.sp, color = TealAccent) },
                        colors = AssistChipDefaults.assistChipColors(containerColor = Color(0xFF00363D))
                    )
                }
            }
        }
    }
}

@Composable
fun InterimTranscriptBubble(speakerName: String, text: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFF0A192F))
            .padding(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "$speakerName (speaking...)",
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color(0xFF38BDF8)
            )
            CircularProgressIndicator(
                modifier = Modifier.size(12.dp),
                strokeWidth = 2.dp,
                color = Color(0xFF38BDF8)
            )
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = text,
            fontSize = 15.sp,
            fontStyle = FontStyle.Italic,
            color = Color(0xFFBAE6FD)
        )
    }
}

@Composable
fun ChatBubble(message: ChatMessage) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.End
    ) {
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(topStart = 16.dp, topEnd = 4.dp, bottomEnd = 16.dp, bottomStart = 16.dp))
                .background(TealAccent)
                .padding(horizontal = 14.dp, vertical = 10.dp)
        ) {
            Text(
                text = message.content,
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = Color.Black
            )
        }
        Text(
            text = "Sent silently",
            fontSize = 10.sp,
            color = TextSecondary,
            modifier = Modifier.padding(top = 2.dp, end = 4.dp)
        )
    }
}

@Composable
fun QuickReplyChip(label: String, onClick: (String) -> Unit) {
    SuggestionChip(
        onClick = { onClick(label) },
        label = { Text(label, fontSize = 11.sp, color = TextPrimary) },
        colors = SuggestionChipDefaults.suggestionChipColors(containerColor = SurfaceCard)
    )
}

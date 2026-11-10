package com.callsight.app.ui.call

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.callsight.app.data.model.User
import com.callsight.app.ui.theme.*

@Composable
fun ActiveCallScreen(
    caller: User,
    durationText: String,
    onEnterSilentReadingMode: () -> Unit,
    onEndCall: () -> Unit
) {
    var isMuted by remember { mutableStateOf(false) }
    var isSpeakerOn by remember { mutableStateOf(true) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(DarkNavyBackground, DeepSurface, DarkNavyBackground)
                )
            )
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Top status
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(top = 16.dp)) {
            Surface(
                color = Color(0xFF064E3B),
                shape = RoundedCornerShape(16.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(Color(0xFF34D399)))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("WebRTC Audio Connected", fontSize = 11.sp, color = Color(0xFFA7F3D0), fontWeight = FontWeight.Bold)
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(durationText, fontSize = 24.sp, fontWeight = FontWeight.Bold, color = TealAccent)
        }

        // Center Caller Avatar
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                modifier = Modifier
                    .size(120.dp)
                    .clip(CircleShape)
                    .background(SurfaceCard),
                contentAlignment = Alignment.Center
            ) {
                Text(caller.name.take(1), fontSize = 48.sp, fontWeight = FontWeight.Bold, color = TealAccent)
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text(caller.name, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            Spacer(modifier = Modifier.height(4.dp))
            Text(caller.email, fontSize = 12.sp, color = TextSecondary)
            Spacer(modifier = Modifier.height(8.dp))
            Surface(
                color = Color(0xFF00363D),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(
                    "Mutual Consent Active",
                    fontSize = 11.sp,
                    color = TealAccent,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                )
            }
        }

        // Silent Reading Mode Banner & Bottom Controls
        Column(
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            Button(
                onClick = onEnterSilentReadingMode,
                colors = ButtonDefaults.buttonColors(containerColor = TealAccent, contentColor = Color.Black),
                shape = RoundedCornerShape(20.dp),
                modifier = Modifier.fillMaxWidth().height(56.dp)
            ) {
                Icon(Icons.Default.Visibility, contentDescription = null, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(10.dp))
                Column {
                    Text("Enter Silent Reading Mode", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text("Read live captions & respond via text", fontSize = 10.sp, color = Color(0xFF00363D))
                }
            }

            // Audio Controls (Mute, End, Speaker)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = { isMuted = !isMuted },
                    modifier = Modifier.size(54.dp).clip(CircleShape).background(if (isMuted) Color(0xFF7F1D1D) else SurfaceCard)
                ) {
                    Icon(
                        if (isMuted) Icons.Default.MicOff else Icons.Default.Mic,
                        contentDescription = "Mute",
                        tint = if (isMuted) Color(0xFFFCA5A5) else TextPrimary
                    )
                }

                IconButton(
                    onClick = onEndCall,
                    modifier = Modifier.size(64.dp).clip(CircleShape).background(ErrorRed)
                ) {
                    Icon(Icons.Default.CallEnd, contentDescription = "End Call", tint = Color.White, modifier = Modifier.size(28.dp))
                }

                IconButton(
                    onClick = { isSpeakerOn = !isSpeakerOn },
                    modifier = Modifier.size(54.dp).clip(CircleShape).background(if (!isSpeakerOn) Color(0xFF78350F) else SurfaceCard)
                ) {
                    Icon(
                        if (isSpeakerOn) Icons.Default.VolumeUp else Icons.Default.VolumeOff,
                        contentDescription = "Speaker",
                        tint = if (!isSpeakerOn) Color(0xFFFCD34D) else TextPrimary
                    )
                }
            }
        }
    }
}

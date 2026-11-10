package com.callsight.app.ui.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.callsight.app.data.model.User
import com.callsight.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    currentUser: User,
    onBack: () -> Unit,
    onSignOut: () -> Unit
) {
    var requireConsent by remember { mutableStateOf(true) }
    var storeTranscripts by remember { mutableStateOf(true) }
    var selectedLanguage by remember { mutableStateOf("English (India) - en-IN") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings", fontWeight = FontWeight.Bold, color = TextPrimary) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = TextPrimary)
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
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Gnani Info Card
            Surface(
                color = SurfaceCard,
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("AI SPEECH ENGINE", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TealAccent)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Gnani AI Prisma v2.5", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    Text("16000 Hz signed 16-bit PCM streaming", fontSize = 11.sp, color = TextSecondary)
                }
            }

            // Privacy & Consent
            Surface(
                color = SurfaceCard,
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("PRIVACY & SECURITY", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TealAccent)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Mutual Consent", fontWeight = FontWeight.SemiBold, fontSize = 13.sp, color = TextPrimary)
                            Text("Both parties must consent before captions activate", fontSize = 11.sp, color = TextSecondary)
                        }
                        Switch(checked = requireConsent, onCheckedChange = { requireConsent = it })
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Save Transcripts", fontWeight = FontWeight.SemiBold, fontSize = 13.sp, color = TextPrimary)
                            Text("Keep text transcripts in local call history", fontSize = 11.sp, color = TextSecondary)
                        }
                        Switch(checked = storeTranscripts, onCheckedChange = { storeTranscripts = it })
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Zero Audio Retention", fontWeight = FontWeight.SemiBold, fontSize = 13.sp, color = TextPrimary)
                            Text("Audio frames are immediately discarded post-STT", fontSize = 11.sp, color = TextSecondary)
                        }
                        Switch(checked = true, onCheckedChange = {}, enabled = false)
                    }
                }
            }

            // User Profile & Logout
            Button(
                onClick = onSignOut,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7F1D1D), contentColor = Color(0xFFFCA5A5)),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth().height(48.dp)
            ) {
                Icon(Icons.Default.Logout, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Sign Out", fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
        }
    }
}

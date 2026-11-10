package com.callsight.app

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import com.callsight.app.data.model.CallSession
import com.callsight.app.data.model.User
import com.callsight.app.ui.call.ActiveCallScreen
import com.callsight.app.ui.history.CallHistoryScreen
import com.callsight.app.ui.home.HomeScreen
import com.callsight.app.ui.settings.SettingsScreen
import com.callsight.app.ui.silentmode.SilentReadingModeScreen
import com.callsight.app.ui.theme.CallSightDarkColorScheme
import com.callsight.app.ui.welcome.WelcomeScreen

enum class Screen {
    WELCOME, HOME, ACTIVE_CALL, SILENT_READING, HISTORY, SETTINGS
}

class MainActivity : ComponentActivity() {

    private val requestAudioPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        // Audio permission granted for WebRTC AudioTrack and microphone
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Check RECORD_AUDIO permission
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            requestAudioPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
        }

        setContent {
            androidx.compose.material3.MaterialTheme(colorScheme = CallSightDarkColorScheme) {
                Surface(modifier = Modifier.fillMaxSize()) {
                    CallSightNavigationHost()
                }
            }
        }
    }
}

@Composable
fun CallSightNavigationHost() {
    var currentScreen by remember { mutableStateOf(Screen.HOME) }
    var currentUser by remember {
        mutableStateOf(User("usr_1", "Marcus Sterling", "marcus@callsight.io"))
    }
    var activePartner by remember {
        mutableStateOf(User("usr_2", "Elena Vance", "elena@callsight.io"))
    }

    when (currentScreen) {
        Screen.WELCOME -> {
            WelcomeScreen(
                onSignInClick = { currentScreen = Screen.HOME },
                onRegisterClick = { currentScreen = Screen.HOME }
            )
        }
        Screen.HOME -> {
            HomeScreen(
                currentUser = currentUser,
                users = listOf(
                    User("usr_2", "Elena Vance", "elena@callsight.io"),
                    User("usr_3", "David Kim", "david@callsight.io")
                ),
                recentCalls = listOf(
                    CallSession("c1", "usr_2", "Elena Vance", "usr_1", "Marcus Sterling", "completed", 142, true)
                ),
                onStartCall = {
                    activePartner = it
                    currentScreen = Screen.ACTIVE_CALL
                },
                onOpenCallHistory = { currentScreen = Screen.HISTORY },
                onOpenSettings = { currentScreen = Screen.SETTINGS },
                onViewTranscript = { currentScreen = Screen.HISTORY }
            )
        }
        Screen.ACTIVE_CALL -> {
            ActiveCallScreen(
                caller = activePartner,
                durationText = "01:24",
                onEnterSilentReadingMode = { currentScreen = Screen.SILENT_READING },
                onEndCall = { currentScreen = Screen.HOME }
            )
        }
        Screen.SILENT_READING -> {
            SilentReadingModeScreen(
                callerName = activePartner.name,
                callDuration = "01:24",
                isTranscriptionPaused = false,
                transcriptItems = emptyList(),
                interimText = null,
                smartHighlights = emptyList(),
                chatMessages = emptyList(),
                onTogglePause = {},
                onSendTextMessage = {},
                onEndCall = { currentScreen = Screen.HOME },
                onBackToCall = { currentScreen = Screen.ACTIVE_CALL }
            )
        }
        Screen.HISTORY -> {
            CallHistoryScreen(
                calls = listOf(
                    CallSession("c1", "usr_2", "Elena Vance", "usr_1", "Marcus Sterling", "completed", 142, true)
                ),
                onBack = { currentScreen = Screen.HOME },
                onOpenTranscript = {},
                onDeleteTranscript = {}
            )
        }
        Screen.SETTINGS -> {
            SettingsScreen(
                currentUser = currentUser,
                onBack = { currentScreen = Screen.HOME },
                onSignOut = { currentScreen = Screen.WELCOME }
            )
        }
    }
}

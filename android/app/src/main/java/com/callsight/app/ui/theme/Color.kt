package com.callsight.app.ui.theme

import androidx.compose.material3.darkColorScheme
import androidx.compose.ui.graphics.Color

val DarkNavyBackground = Color(0xFF090D16)
val DeepSurface = Color(0xFF111726)
val SurfaceCard = Color(0xFF182238)
val TealAccent = Color(0xFF00E5FF)
val TealAccentMuted = Color(0xFF00B4D8)
val TextPrimary = Color(0xFFF1F5F9)
val TextSecondary = Color(0xFF94A3B8)
val ErrorRed = Color(0xFFEF4444)
val SuccessGreen = Color(0xFF10B981)

val CallSightDarkColorScheme = darkColorScheme(
    primary = TealAccent,
    onPrimary = Color(0xFF00363D),
    primaryContainer = Color(0xFF004F59),
    onPrimaryContainer = Color(0xFF9CF0FF),
    secondary = TealAccentMuted,
    onSecondary = Color(0xFF003544),
    background = DarkNavyBackground,
    onBackground = TextPrimary,
    surface = DeepSurface,
    onSurface = TextPrimary,
    surfaceVariant = SurfaceCard,
    onSurfaceVariant = TextSecondary,
    error = ErrorRed
)

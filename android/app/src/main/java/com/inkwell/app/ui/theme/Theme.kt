package com.inkwell.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val Paper = Color(0xFFF3EEE4)
private val Ink = Color(0xFF1B1712)
private val Pine = Color(0xFF2C5C4F)
private val Soft = Color(0xFF4E463B)

private val Scheme = lightColorScheme(
    primary = Pine,
    onPrimary = Paper,
    background = Paper,
    onBackground = Ink,
    surface = Color(0xFFFFFDF8),
    onSurface = Ink,
    secondary = Soft,
    tertiary = Color(0xFF8C3A32),
)

@Composable
fun InkwellTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = Scheme, content = content)
}

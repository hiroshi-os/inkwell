package com.inkwell.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val WpOrange = Color(0xFFFF500A)
val WpOrangeHover = Color(0xFFE54809)
private val Ink = Color(0xFF222222)
private val Soft = Color(0xFF6A6A6A)
private val Page = Color(0xFFF7F7F7)

private val Scheme = lightColorScheme(
    primary = WpOrange,
    onPrimary = Color.White,
    background = Page,
    onBackground = Ink,
    surface = Color.White,
    onSurface = Ink,
    secondary = Soft,
    tertiary = WpOrangeHover,
    outline = Color(0xFFE6E6E6),
)

@Composable
fun InkwellTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = Scheme, content = content)
}

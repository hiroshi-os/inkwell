package com.inkwell.app.ui.browse

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import com.inkwell.app.data.Graph
import com.inkwell.app.data.Story
import kotlinx.coroutines.launch
import kotlin.math.abs

@Composable
fun BrowseScreen(onOpen: (String) -> Unit) {
    var q by remember { mutableStateOf("") }
    var stories by remember { mutableStateOf<List<Story>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    fun reload(query: String) {
        scope.launch {
            loading = true
            error = null
            runCatching { Graph.api.stories(query.ifBlank { null }) }
                .onSuccess { stories = it.stories; loading = false }
                .onFailure { error = it.message ?: "Could not reach API"; loading = false }
        }
    }

    LaunchedEffect(Unit) { reload("") }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Browse", style = MaterialTheme.typography.headlineMedium, fontFamily = FontFamily.Serif)
        Text(
            "Public shelf from the Inkwell API. Seeded stories appear after the Go server starts.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.secondary,
            modifier = Modifier.padding(top = 4.dp, bottom = 12.dp),
        )
        OutlinedTextField(
            value = q,
            onValueChange = {
                q = it
                reload(it)
            },
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("Search titles") },
            singleLine = true,
        )
        when {
            loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            error != null -> Text(error ?: "", color = MaterialTheme.colorScheme.tertiary, modifier = Modifier.padding(top = 16.dp))
            stories.isEmpty() -> Text("No stories yet.", modifier = Modifier.padding(top = 16.dp))
            else -> LazyColumn(
                contentPadding = PaddingValues(vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(stories, key = { it.id }) { story ->
                    StoryRow(story) { onOpen(story.id) }
                }
            }
        }
    }
}

@Composable
fun StoryRow(story: Story, onClick: () -> Unit) {
    Column(
        Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .background(MaterialTheme.colorScheme.surface)
    ) {
        Box(
            Modifier
                .fillMaxWidth()
                .height(88.dp)
                .background(coverBrush(story.coverHue)),
        ) {
            Text(
                story.genre.ifBlank { "Story" },
                color = Color(0xFFF6EFE4),
                modifier = Modifier.align(Alignment.BottomStart).padding(12.dp),
                style = MaterialTheme.typography.labelMedium,
            )
        }
        Column(Modifier.padding(12.dp)) {
            Text(story.title, style = MaterialTheme.typography.titleLarge, fontFamily = FontFamily.Serif)
            Text(
                "${story.author.displayName} · ${story.chapterCount} ch.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.secondary,
            )
            Text(story.synopsis, style = MaterialTheme.typography.bodyMedium, maxLines = 3)
        }
    }
}

fun coverBrush(hue: Int): Brush {
    val h = abs(hue) % 360
    return Brush.linearGradient(
        listOf(
            Color.hsl(h.toFloat(), 0.32f, 0.26f),
            Color.hsl(((h + 46) % 360).toFloat(), 0.38f, 0.14f),
        ),
    )
}

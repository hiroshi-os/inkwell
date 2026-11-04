package com.inkwell.app.ui.browse

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.inkwell.app.data.Graph
import com.inkwell.app.data.Story
import kotlinx.coroutines.launch
import kotlin.math.abs

@Composable
fun BrowseScreen(onOpen: (String) -> Unit, showSearch: Boolean = true) {
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

    val grouped = stories.groupBy { it.genre.ifBlank { "Stories" } }

    Column(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        Row(
            Modifier.fillMaxWidth().background(Color.White).padding(16.dp, 14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                Modifier
                    .width(28.dp)
                    .height(28.dp)
                    .clip(RoundedCornerShape(6.dp))
                    .background(MaterialTheme.colorScheme.primary),
                contentAlignment = Alignment.Center,
            ) {
                Text("i", color = Color.White, fontWeight = FontWeight.Black, fontSize = 16.sp)
            }
            Text("  inkwell", fontWeight = FontWeight.Bold, fontSize = 20.sp)
        }
        if (showSearch) {
            OutlinedTextField(
                value = q,
                onValueChange = {
                    q = it
                    reload(it)
                },
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                placeholder = { Text("Search") },
                singleLine = true,
                shape = RoundedCornerShape(24.dp),
            )
        }
        when {
            loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            error != null -> Text(error ?: "", color = MaterialTheme.colorScheme.tertiary, modifier = Modifier.padding(16.dp))
            stories.isEmpty() -> Text("No stories yet.", modifier = Modifier.padding(16.dp))
            else -> LazyColumn(contentPadding = PaddingValues(bottom = 24.dp)) {
                item {
                    Text("Home", fontWeight = FontWeight.Bold, fontSize = 22.sp, modifier = Modifier.padding(16.dp, 16.dp, 16.dp, 4.dp))
                }
                item { StoryRail("Trending", stories, onOpen) }
                grouped.forEach { (genre, list) ->
                    item { StoryRail(genre, list, onOpen) }
                }
            }
        }
    }
}

@Composable
fun StoryRail(title: String, stories: List<Story>, onOpen: (String) -> Unit) {
    Column(Modifier.padding(top = 12.dp)) {
        Text(title, fontWeight = FontWeight.Bold, fontSize = 18.sp, modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp))
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            items(stories, key = { it.id }) { story ->
                StoryCoverCard(story) { onOpen(story.id) }
            }
        }
    }
}

@Composable
fun StoryCoverCard(story: Story, onClick: () -> Unit) {
    Column(Modifier.width(120.dp).clickable(onClick = onClick)) {
        Box(
            Modifier
                .width(120.dp)
                .height(180.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(coverBrush(story.coverHue)),
        ) {
            Text(
                story.genre.ifBlank { "Story" }.uppercase(),
                color = Color.White,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.align(Alignment.TopStart).padding(8.dp),
            )
            Text(
                story.title,
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp,
                modifier = Modifier.align(Alignment.BottomStart).padding(8.dp),
                maxLines = 3,
            )
        }
        Text(story.title, fontWeight = FontWeight.Bold, fontSize = 13.sp, maxLines = 2, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(top = 6.dp))
        Text(story.author.displayName, color = MaterialTheme.colorScheme.secondary, fontSize = 12.sp, maxLines = 1)
    }
}

@Composable
fun StoryRow(story: Story, onClick: () -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .background(Color.White)
            .padding(16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            Modifier
                .width(72.dp)
                .height(108.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(coverBrush(story.coverHue)),
        )
        Column(Modifier.weight(1f)) {
            Text(story.title, fontWeight = FontWeight.Bold, fontSize = 16.sp)
            Text(story.author.displayName, color = MaterialTheme.colorScheme.secondary, fontSize = 13.sp)
            Text(story.synopsis, maxLines = 3, overflow = TextOverflow.Ellipsis, color = MaterialTheme.colorScheme.secondary, fontSize = 13.sp, modifier = Modifier.padding(top = 4.dp))
            Text("${story.chapterCount} Parts", color = MaterialTheme.colorScheme.secondary, fontSize = 12.sp, modifier = Modifier.padding(top = 6.dp))
        }
    }
}

fun coverBrush(hue: Int): Brush {
    val h = abs(hue) % 360
    return Brush.linearGradient(
        listOf(
            Color.hsl(h.toFloat(), 0.62f, 0.42f),
            Color.hsl(((h + 28) % 360).toFloat(), 0.48f, 0.18f),
        ),
    )
}

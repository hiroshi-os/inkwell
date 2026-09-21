package com.inkwell.app.ui.library

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import com.inkwell.app.data.Graph
import com.inkwell.app.data.Story
import com.inkwell.app.ui.browse.StoryRow

@Composable
fun LibraryScreen(onOpen: (String) -> Unit, onLogin: () -> Unit) {
    var stories by remember { mutableStateOf<List<Story>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Graph.session.token) {
        if (!Graph.session.isLoggedIn) return@LaunchedEffect
        runCatching { Graph.api.library() }
            .onSuccess { stories = it.stories; error = null }
            .onFailure { error = it.message }
    }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Library", style = MaterialTheme.typography.headlineMedium, fontFamily = FontFamily.Serif)
        Text(
            "Saved stories. Stub: no offline files, just a server-side shelf.",
            color = MaterialTheme.colorScheme.secondary,
            modifier = Modifier.padding(bottom = 12.dp),
        )
        if (!Graph.session.isLoggedIn) {
            Text("Log in to keep a shelf.")
            TextButton(onClick = onLogin) { Text("Log in") }
            return
        }
        if (error != null) Text(error ?: "", color = MaterialTheme.colorScheme.tertiary)
        if (stories.isEmpty()) {
            Box(Modifier.padding(top = 12.dp)) { Text("Nothing saved yet.") }
        } else {
            LazyColumn {
                items(stories, key = { it.id }) { StoryRow(it) { onOpen(it.id) } }
            }
        }
    }
}

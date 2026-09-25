package com.inkwell.app.ui.library

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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

    Column(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        Text("Library", fontWeight = FontWeight.Bold, fontSize = 22.sp, modifier = Modifier.padding(16.dp))
        Text("Current Reads", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 16.dp))
        if (!Graph.session.isLoggedIn) {
            Text("Log in to keep stories here.", modifier = Modifier.padding(16.dp))
            Button(onClick = onLogin, modifier = Modifier.padding(horizontal = 16.dp)) { Text("Log in") }
            return
        }
        if (error != null) Text(error ?: "", color = MaterialTheme.colorScheme.tertiary, modifier = Modifier.padding(16.dp))
        if (stories.isEmpty()) {
            Text("Nothing saved yet.", modifier = Modifier.padding(16.dp), color = MaterialTheme.colorScheme.secondary)
        } else {
            LazyColumn {
                items(stories, key = { it.id }) { StoryRow(it) { onOpen(it.id) } }
            }
        }
    }
}

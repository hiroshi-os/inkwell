package com.inkwell.app.ui.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
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
import com.inkwell.app.data.User

@Composable
fun ProfileScreen(onLogin: () -> Unit, onLoggedOut: () -> Unit) {
    var user by remember { mutableStateOf<User?>(null) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Graph.session.token) {
        if (!Graph.session.isLoggedIn) {
            user = null
            return@LaunchedEffect
        }
        runCatching { Graph.api.me() }
            .onSuccess { user = it; error = null }
            .onFailure { error = it.message }
    }

    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text("You", style = MaterialTheme.typography.headlineMedium, fontFamily = FontFamily.Serif)
        if (!Graph.session.isLoggedIn) {
            Text("Profile stub: log in against the Go API to see username, bio, and follow counts.")
            Button(onClick = onLogin) { Text("Log in") }
            return
        }
        val u = user
        if (error != null) Text(error ?: "", color = MaterialTheme.colorScheme.tertiary)
        if (u != null) {
            Text(u.displayName, style = MaterialTheme.typography.headlineSmall, fontFamily = FontFamily.Serif)
            Text("@${u.username}")
            Text(u.bio.ifBlank { "No bio yet." })
            Text("${u.followers} followers · ${u.following} following", color = MaterialTheme.colorScheme.secondary)
        }
        Text(
            "Authoring (create story/chapter) is on the web app. This client is browse + read + auth.",
            color = MaterialTheme.colorScheme.secondary,
        )
        OutlinedButton(onClick = {
            Graph.session.clear()
            user = null
            onLoggedOut()
        }) { Text("Log out") }
    }
}

package com.inkwell.app.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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

    Column(Modifier.background(MaterialTheme.colorScheme.background).padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text("Profile", fontWeight = FontWeight.Bold, fontSize = 22.sp)
        if (!Graph.session.isLoggedIn) {
            Text("Log in to see your profile.")
            Button(onClick = onLogin) { Text("Log in") }
            return
        }
        val u = user
        if (error != null) Text(error ?: "", color = MaterialTheme.colorScheme.tertiary)
        if (u != null) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Box(
                    Modifier.size(64.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primary),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(u.displayName.take(1).uppercase(), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 24.sp)
                }
                Column {
                    Text(u.displayName, fontWeight = FontWeight.Bold, fontSize = 20.sp)
                    Text("@${u.username}", color = MaterialTheme.colorScheme.secondary)
                    Text("${u.followers} followers · ${u.following} following", color = MaterialTheme.colorScheme.secondary, fontSize = 13.sp)
                }
            }
            Text(u.bio.ifBlank { "No bio yet." })
        }
        Text("Writing is on the web app for this MVP.", color = MaterialTheme.colorScheme.secondary, fontSize = 13.sp)
        OutlinedButton(onClick = {
            Graph.session.clear()
            user = null
            onLoggedOut()
        }) { Text("Log out") }
    }
}

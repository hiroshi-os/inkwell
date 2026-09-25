package com.inkwell.app.ui.story

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.inkwell.app.data.Graph
import com.inkwell.app.data.Story
import com.inkwell.app.ui.browse.coverBrush
import kotlinx.coroutines.launch

@Composable
fun StoryScreen(
    storyId: String,
    onRead: (chapterId: String) -> Unit,
    onBack: () -> Unit,
) {
    var story by remember { mutableStateOf<Story?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    fun reload() {
        scope.launch {
            runCatching { Graph.api.story(storyId) }
                .onSuccess { story = it; error = null }
                .onFailure { error = it.message }
        }
    }

    LaunchedEffect(storyId) { reload() }

    val s = story
    if (error != null && s == null) {
        Text(error ?: "", modifier = Modifier.padding(16.dp), color = MaterialTheme.colorScheme.tertiary)
        return
    }
    if (s == null) {
        CircularProgressIndicator(Modifier.padding(24.dp))
        return
    }
    val first = s.chapters?.firstOrNull { it.published } ?: s.chapters?.firstOrNull()
    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Text("← Browse", modifier = Modifier.clickable(onClick = onBack), color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            Box(
                Modifier
                    .width(120.dp)
                    .height(180.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(coverBrush(s.coverHue)),
            )
            Column(Modifier.weight(1f)) {
                Text(s.title, fontWeight = FontWeight.Bold, fontSize = 22.sp)
                Text("by ${s.author.displayName}", color = MaterialTheme.colorScheme.secondary)
                Text(
                    s.genre.ifBlank { "Story" },
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    modifier = Modifier.padding(top = 6.dp),
                )
                Text("${s.chapterCount} Parts · Ongoing", color = MaterialTheme.colorScheme.secondary, fontSize = 13.sp)
            }
        }
        Text(s.synopsis, color = MaterialTheme.colorScheme.secondary)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            if (first != null) {
                Button(onClick = { onRead(first.id) }, colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)) {
                    Text("Start reading")
                }
            }
            if (Graph.session.isLoggedIn) {
                OutlinedButton(onClick = {
                    scope.launch {
                        if (s.inLibrary) Graph.api.removeLibrary(s.id) else Graph.api.addLibrary(s.id)
                        reload()
                    }
                }) { Text(if (s.inLibrary) "Added" else "+ Add") }
                if (Graph.session.userId != s.author.id) {
                    OutlinedButton(onClick = {
                        scope.launch {
                            if (s.followingAuthor) Graph.api.unfollow(s.author.id) else Graph.api.follow(s.author.id)
                            reload()
                        }
                    }) { Text(if (s.followingAuthor) "Following" else "Follow") }
                }
            }
        }
        Text("Table of Contents", fontWeight = FontWeight.Bold, fontSize = 18.sp, modifier = Modifier.padding(top = 8.dp))
        Column(Modifier.background(Color.White).clip(RoundedCornerShape(8.dp))) {
            s.chapters.orEmpty().filter { it.published }.forEach { ch ->
                Text(
                    "${ch.position}. ${ch.title}",
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onRead(ch.id) }
                        .padding(14.dp),
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }
    }
}

package com.inkwell.app.ui.reader

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.inkwell.app.data.Chapter
import com.inkwell.app.data.Graph

@Composable
fun ReaderScreen(
    storyId: String,
    chapterId: String,
    onOpenChapter: (String) -> Unit,
    onBack: () -> Unit,
) {
    var ch by remember { mutableStateOf<Chapter?>(null) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(storyId, chapterId) {
        runCatching { Graph.api.chapter(storyId, chapterId) }
            .onSuccess { ch = it; error = null }
            .onFailure { error = it.message }
    }

    val c = ch
    if (error != null && c == null) {
        Text(error ?: "", modifier = Modifier.padding(16.dp))
        return
    }
    if (c == null) {
        CircularProgressIndicator(Modifier.padding(24.dp))
        return
    }

    Column(
        Modifier
            .fillMaxSize()
            .background(Color.White)
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
    ) {
        Text(c.storyTitle ?: "Story", modifier = Modifier.clickable(onClick = onBack), color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
        Text("Part ${c.position}", color = MaterialTheme.colorScheme.secondary, modifier = Modifier.padding(top = 12.dp))
        Text(c.title, fontWeight = FontWeight.Bold, fontSize = 24.sp, modifier = Modifier.padding(vertical = 8.dp))
        Text(c.body, fontSize = 18.sp, lineHeight = 30.sp, color = Color(0xFF333333))
        Row(
            Modifier.fillMaxWidth().padding(top = 28.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            if (!c.prevId.isNullOrBlank()) {
                Text("← Previous Part", modifier = Modifier.clickable { onOpenChapter(c.prevId!!) }, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
            } else {
                Text("Beginning", color = MaterialTheme.colorScheme.secondary)
            }
            if (!c.nextId.isNullOrBlank()) {
                Text("Next Part →", modifier = Modifier.clickable { onOpenChapter(c.nextId!!) }, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
            } else {
                Text("End", color = MaterialTheme.colorScheme.secondary)
            }
        }
    }
}

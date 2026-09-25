package com.inkwell.app.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.inkwell.app.data.Graph
import com.inkwell.app.data.LoginBody
import com.inkwell.app.data.RegisterBody
import kotlinx.coroutines.launch

@Composable
fun AuthScreen(onDone: () -> Unit) {
    var register by remember { mutableStateOf(false) }
    var username by remember { mutableStateOf("reader") }
    var password by remember { mutableStateOf("password123") }
    var email by remember { mutableStateOf("") }
    var displayName by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    Column(Modifier.background(Color.White).padding(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Box(
                Modifier.width(28.dp).height(28.dp).clip(RoundedCornerShape(6.dp)).background(MaterialTheme.colorScheme.primary),
                contentAlignment = Alignment.Center,
            ) { Text("i", color = Color.White, fontWeight = FontWeight.Black) }
            Text("inkwell", fontWeight = FontWeight.Bold, fontSize = 20.sp)
        }
        Text(if (register) "Sign up" else "Log in", fontWeight = FontWeight.Bold, fontSize = 26.sp)
        OutlinedTextField(username, { username = it }, label = { Text("Username") }, modifier = Modifier.fillMaxWidth())
        if (register) {
            OutlinedTextField(email, { email = it }, label = { Text("Email") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(displayName, { displayName = it }, label = { Text("Display name") }, modifier = Modifier.fillMaxWidth())
        }
        OutlinedTextField(
            password,
            { password = it },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth(),
        )
        if (error != null) Text(error ?: "", color = MaterialTheme.colorScheme.tertiary)
        Button(onClick = {
            scope.launch {
                error = null
                val result = runCatching {
                    if (register) {
                        Graph.api.register(
                            RegisterBody(username, email, password, displayName.ifBlank { username }),
                        )
                    } else {
                        Graph.api.login(LoginBody(username, password))
                    }
                }
                result.onSuccess {
                    Graph.session.save(it)
                    onDone()
                }.onFailure { error = it.message }
            }
        }, modifier = Modifier.fillMaxWidth()) {
            Text(if (register) "Sign up" else "Log in")
        }
        OutlinedButton(onClick = { register = !register }, modifier = Modifier.fillMaxWidth()) {
            Text(if (register) "Have an account? Log in" else "Don't have an account? Sign up")
        }
    }
}

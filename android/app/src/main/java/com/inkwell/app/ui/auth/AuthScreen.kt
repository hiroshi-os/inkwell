package com.inkwell.app.ui.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
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
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
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

    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text(if (register) "Join Inkwell" else "Log in", style = MaterialTheme.typography.headlineMedium, fontFamily = FontFamily.Serif)
        Text("Talks to the same JWT API as the web app. Seed: iris / niko / reader — password123")
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
            Text(if (register) "Create account" else "Enter")
        }
        OutlinedButton(onClick = { register = !register }, modifier = Modifier.fillMaxWidth()) {
            Text(if (register) "Have an account?" else "Need an account?")
        }
    }
}

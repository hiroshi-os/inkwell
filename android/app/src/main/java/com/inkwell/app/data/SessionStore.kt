package com.inkwell.app.data

import android.content.Context

class SessionStore(context: Context) {
    private val prefs = context.getSharedPreferences("inkwell", Context.MODE_PRIVATE)

    var token: String?
        get() = prefs.getString("token", null)
        set(value) { prefs.edit().putString("token", value).apply() }

    var username: String?
        get() = prefs.getString("username", null)
        set(value) { prefs.edit().putString("username", value).apply() }

    var displayName: String?
        get() = prefs.getString("displayName", null)
        set(value) { prefs.edit().putString("displayName", value).apply() }

    val isLoggedIn: Boolean get() = !token.isNullOrBlank()

    fun save(auth: AuthResponse) {
        token = auth.token
        username = auth.user.username
        displayName = auth.user.displayName
    }

    fun clear() {
        prefs.edit().clear().apply()
    }
}

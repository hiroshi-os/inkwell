package com.inkwell.app.data

data class Author(
    val id: String = "",
    val username: String = "",
    val displayName: String = "",
)

data class User(
    val id: String = "",
    val username: String = "",
    val displayName: String = "",
    val bio: String = "",
    val followers: Int = 0,
    val following: Int = 0,
)

data class ChapterMeta(
    val id: String = "",
    val title: String = "",
    val position: Int = 0,
    val published: Boolean = true,
    val wordCount: Int = 0,
)

data class Story(
    val id: String = "",
    val title: String = "",
    val synopsis: String = "",
    val genre: String = "",
    val status: String = "",
    val coverHue: Int = 160,
    val author: Author = Author(),
    val chapterCount: Int = 0,
    val inLibrary: Boolean = false,
    val followingAuthor: Boolean = false,
    val chapters: List<ChapterMeta>? = null,
)

data class Chapter(
    val id: String = "",
    val storyId: String = "",
    val title: String = "",
    val body: String = "",
    val position: Int = 0,
    val prevId: String? = null,
    val nextId: String? = null,
    val storyTitle: String? = null,
    val wordCount: Int = 0,
)

data class StoriesResponse(val stories: List<Story> = emptyList())
data class AuthResponse(val token: String = "", val user: User = User())
data class LoginBody(val username: String, val password: String)
data class RegisterBody(
    val username: String,
    val email: String,
    val password: String,
    val displayName: String,
)
data class FlagResponse(val following: Boolean = false, val inLibrary: Boolean = false)
data class UserResponse(val user: User = User(), val following: Boolean = false)

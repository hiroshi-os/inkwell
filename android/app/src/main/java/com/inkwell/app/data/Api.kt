package com.inkwell.app.data

import com.inkwell.app.BuildConfig
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface InkwellApi {
    @GET("api/stories")
    suspend fun stories(@Query("q") q: String? = null): StoriesResponse

    @GET("api/stories/{id}")
    suspend fun story(@Path("id") id: String): Story

    @GET("api/stories/{id}/chapters/{chapterId}")
    suspend fun chapter(
        @Path("id") id: String,
        @Path("chapterId") chapterId: String,
    ): Chapter

    @POST("api/auth/login")
    suspend fun login(@Body body: LoginBody): AuthResponse

    @POST("api/auth/register")
    suspend fun register(@Body body: RegisterBody): AuthResponse

    @GET("api/me")
    suspend fun me(): User

    @GET("api/me/library")
    suspend fun library(): StoriesResponse

    @POST("api/stories/{id}/library")
    suspend fun addLibrary(@Path("id") id: String): FlagResponse

    @DELETE("api/stories/{id}/library")
    suspend fun removeLibrary(@Path("id") id: String): FlagResponse

    @POST("api/users/{id}/follow")
    suspend fun follow(@Path("id") id: String): FlagResponse

    @DELETE("api/users/{id}/follow")
    suspend fun unfollow(@Path("id") id: String): FlagResponse
}

object Graph {
    lateinit var session: SessionStore
        private set
    lateinit var api: InkwellApi
        private set

    fun init(context: android.content.Context) {
        session = SessionStore(context.applicationContext)
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        }
        val auth = Interceptor { chain ->
            val token = session.token
            val req = if (token.isNullOrBlank()) {
                chain.request()
            } else {
                chain.request().newBuilder()
                    .header("Authorization", "Bearer $token")
                    .build()
            }
            chain.proceed(req)
        }
        val client = OkHttpClient.Builder()
            .addInterceptor(auth)
            .addInterceptor(logging)
            .build()
        api = Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(InkwellApi::class.java)
    }
}

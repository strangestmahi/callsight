package com.callsight.app.data.api

import com.callsight.app.data.model.AuthResponse
import com.callsight.app.data.model.CallSession
import com.callsight.app.data.model.User
import retrofit2.Response
import retrofit2.http.*

data class RegisterRequest(val name: String, val email: String, val password: String)
data class LoginRequest(val email: String, val password: String)
data class InitiateCallRequest(val callee_id: String)
data class ConsentRequest(val consent: Boolean)
data class TranscriptResponse(
    val call_id: String,
    val items: List<com.callsight.app.data.model.TranscriptItem>,
    val highlights: List<com.callsight.app.data.model.SmartHighlight>,
    val messages: List<com.callsight.app.data.model.ChatMessage>
)

interface CallSightApi {
    @POST("api/v1/auth/register")
    async suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @POST("api/v1/auth/login")
    async suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @GET("api/v1/users/search")
    async suspend fun searchUsers(@Query("q") query: String): Response<List<User>>

    @POST("api/v1/calls/initiate")
    async suspend fun initiateCall(
        @Query("user_id") userId: String,
        @Body request: InitiateCallRequest
    ): Response<Map<String, String>>

    @GET("api/v1/calls/history")
    async suspend fun getCallHistory(@Query("user_id") userId: String): Response<List<CallSession>>

    @POST("api/v1/calls/{call_id}/consent")
    async suspend fun updateConsent(
        @Path("call_id") callId: String,
        @Query("user_id") userId: String,
        @Body request: ConsentRequest
    ): Response<Map<String, Any>>

    @GET("api/v1/calls/{call_id}/transcript")
    async suspend fun getTranscript(@Path("call_id") callId: String): Response<TranscriptResponse>

    @DELETE("api/v1/calls/{call_id}/transcript")
    async suspend fun deleteTranscript(@Path("call_id") callId: String): Response<Map<String, String>>
}

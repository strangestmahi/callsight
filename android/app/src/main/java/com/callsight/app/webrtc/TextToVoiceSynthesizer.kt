package com.callsight.app.webrtc

import android.content.Context
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import java.util.Locale

/**
 * Text-to-Voice (TTS) Synthesizer for CallSight on Android.
 * Converts typed messages into synthesized speech during active calls.
 * Enables non-vocal participants to communicate directly into the remote caller's audio stream.
 */
class TextToVoiceSynthesizer(
    private val context: Context,
    private val onInitComplete: (Boolean) -> Unit = {}
) : TextToSpeech.OnInitListener {

    companion object {
        private const val TAG = "TextToVoiceSynthesizer"
    }

    private var tts: TextToSpeech? = null
    private var isInitialized = false

    init {
        tts = TextToSpeech(context, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            val result = tts?.setLanguage(Locale.getDefault())
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                Log.w(TAG, "Language not supported, falling back to US English.")
                tts?.language = Locale.US
            }
            isInitialized = true
            onInitComplete(true)
            Log.i(TAG, "TextToVoiceSynthesizer initialized successfully.")
        } else {
            isInitialized = false
            onInitComplete(false)
            Log.e(TAG, "Failed to initialize Android TextToSpeech.")
        }
    }

    /**
     * Speaks the provided text to the remote caller.
     * @param text message text to vocalize
     * @param onStart callback when speech synthesis begins
     * @param onDone callback when speech synthesis completes
     */
    fun speak(
        text: String,
        utteranceId: String = "tts_${System.currentTimeMillis()}",
        onStart: () -> Unit = {},
        onDone: () -> Unit = {},
        onError: () -> Unit = {}
    ) {
        if (!isInitialized || tts == null) {
            Log.w(TAG, "TTS not ready to speak.")
            onError()
            return
        }

        tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(id: String?) {
                onStart()
            }
            override fun onDone(id: String?) {
                onDone()
            }
            @Deprecated("Deprecated in Java")
            override fun onError(id: String?) {
                onError()
            }
        })

        val params = Bundle()
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, params, utteranceId)
    }

    fun stop() {
        tts?.stop()
    }

    fun setSpeechRate(rate: Float) {
        tts?.setSpeechRate(rate)
    }

    fun setPitch(pitch: Float) {
        tts?.setPitch(pitch)
    }

    fun shutdown() {
        tts?.stop()
        tts?.shutdown()
        tts = null
        isInitialized = false
    }
}

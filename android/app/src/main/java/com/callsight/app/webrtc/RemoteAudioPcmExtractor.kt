package com.callsight.app.webrtc

import android.util.Log
import okhttp3.WebSocket
import okio.ByteString.Companion.toByteString
import org.webrtc.AudioTrack
import org.webrtc.AudioTrackSink
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder

/**
 * Intercepts decoded audio frames from the remote participant's WebRTC AudioTrack.
 * Converts to 16,000 Hz, 16-bit signed linear PCM, mono channel.
 * Segments into 1024-byte chunks (~32ms per frame) and streams to the CallSight backend.
 */
class RemoteAudioPcmExtractor(
    private val audioStreamingWebSocket: WebSocket,
    private val callId: String
) : AudioTrackSink {

    companion object {
        private const val TAG = "RemoteAudioExtractor"
        private const val TARGET_SAMPLE_RATE = 16000
        private const val TARGET_CHANNELS = 1
        private const val CHUNK_SIZE_BYTES = 1024 // 512 samples at 16-bit mono
    }

    private val pcmBuffer = ByteArrayOutputStream()
    private var isPaused = false

    fun pause() {
        isPaused = true
    }

    fun resume() {
        isPaused = false
    }

    /**
     * WebRTC AudioTrackSink callback with decoded remote audio frames.
     * @param audioData raw PCM buffer from remote speaker
     * @param bitsPerSample typically 16
     * @param sampleRate e.g. 48000 or 16000
     * @param numberOfChannels typically 1 or 2
     * @param numberOfFrames frame count in buffer
     */
    override fun onData(
        audioData: ByteBuffer,
        bitsPerSample: Int,
        sampleRate: Int,
        numberOfChannels: Int,
        numberOfFrames: Int
    ) {
        if (isPaused) return

        try {
            val resampledBytes = resampleTo16kHzMono(
                audioData = audioData,
                srcSampleRate = sampleRate,
                srcChannels = numberOfChannels,
                bitsPerSample = bitsPerSample,
                frames = numberOfFrames
            )

            synchronized(pcmBuffer) {
                pcmBuffer.write(resampledBytes)
                val bufferArray = pcmBuffer.toByteArray()
                if (bufferArray.size >= CHUNK_SIZE_BYTES) {
                    var offset = 0
                    while (offset + CHUNK_SIZE_BYTES <= bufferArray.size) {
                        val chunk = bufferArray.copyOfRange(offset, offset + CHUNK_SIZE_BYTES)
                        audioStreamingWebSocket.send(chunk.toByteString())
                        offset += CHUNK_SIZE_BYTES
                    }
                    pcmBuffer.reset()
                    if (offset < bufferArray.size) {
                        val remainder = bufferArray.copyOfRange(offset, bufferArray.size)
                        pcmBuffer.write(remainder)
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error processing remote audio frame", e)
        }
    }

    /**
     * Resamples input PCM to 16 kHz Mono Signed 16-bit Little-Endian PCM.
     */
    private fun resampleTo16kHzMono(
        audioData: ByteBuffer,
        srcSampleRate: Int,
        srcChannels: Int,
        bitsPerSample: Int,
        frames: Int
    ): ByteArray {
        val inputBuffer = audioData.order(ByteOrder.LITTLE_ENDIAN)
        val shortBuffer = inputBuffer.asShortBuffer()
        val totalSamples = frames * srcChannels

        // Extract mono samples
        val monoSamples = ShortArray(frames)
        for (i in 0 until frames) {
            var sum = 0
            for (ch in 0 until srcChannels) {
                val index = i * srcChannels + ch
                if (index < totalSamples) {
                    sum += shortBuffer.get(index)
                }
            }
            monoSamples[i] = (sum / srcChannels).toShort()
        }

        // If already 16kHz, serialize directly
        if (srcSampleRate == TARGET_SAMPLE_RATE) {
            val outBytes = ByteArray(frames * 2)
            ByteBuffer.wrap(outBytes).order(ByteOrder.LITTLE_ENDIAN).asShortBuffer().put(monoSamples)
            return outBytes
        }

        // Linear interpolation resampler to 16,000 Hz
        val ratio = srcSampleRate.toDouble() / TARGET_SAMPLE_RATE.toDouble()
        val outFrameCount = (frames / ratio).toInt()
        val outSamples = ShortArray(outFrameCount)

        for (i in 0 until outFrameCount) {
            val srcIndex = i * ratio
            val index0 = srcIndex.toInt()
            val index1 = (index0 + 1).coerceAtMost(frames - 1)
            val fraction = srcIndex - index0

            val sample0 = monoSamples[index0]
            val sample1 = monoSamples[index1]
            val interpolated = (sample0 + fraction * (sample1 - sample0)).toInt()
            outSamples[i] = interpolated.coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
        }

        val outBytes = ByteArray(outFrameCount * 2)
        ByteBuffer.wrap(outBytes).order(ByteOrder.LITTLE_ENDIAN).asShortBuffer().put(outSamples)
        return outBytes
    }
}

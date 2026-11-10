import React, { useState } from 'react';
import { X, Code, Copy, Check, FileCode, Server, Smartphone } from 'lucide-react';

interface CodeInspectorModalProps {
  onClose: () => void;
}

export const CodeInspectorModal: React.FC<CodeInspectorModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'android' | 'backend'>('android');
  const [selectedFile, setSelectedFile] = useState<string>('RemoteAudioPcmExtractor.kt');
  const [copied, setCopied] = useState(false);

  const fileSnippets: Record<string, { lang: string; path: string; code: string }> = {
    'RemoteAudioPcmExtractor.kt': {
      lang: 'kotlin',
      path: 'android/app/src/main/java/com/callsight/app/webrtc/RemoteAudioPcmExtractor.kt',
      code: `package com.callsight.app.webrtc

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
 * Segments into 1024-byte chunks (~32ms per frame) and streams to CallSight backend.
 */
class RemoteAudioPcmExtractor(
    private val audioStreamingWebSocket: WebSocket,
    private val callId: String
) : AudioTrackSink {

    companion object {
        private const val TARGET_SAMPLE_RATE = 16000
        private const val TARGET_CHANNELS = 1
        private const val CHUNK_SIZE_BYTES = 1024
    }

    private val pcmBuffer = ByteArrayOutputStream()
    private var isPaused = false

    override fun onData(
        audioData: ByteBuffer,
        bitsPerSample: Int,
        sampleRate: Int,
        numberOfChannels: Int,
        numberOfFrames: Int
    ) {
        if (isPaused) return

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
                    pcmBuffer.write(bufferArray.copyOfRange(offset, bufferArray.size))
                }
            }
        }
    }
}`
    },
    'WebRtcManager.kt': {
      lang: 'kotlin',
      path: 'android/app/src/main/java/com/callsight/app/webrtc/WebRtcManager.kt',
      code: `package com.callsight.app.webrtc

import android.content.Context
import org.webrtc.*

class WebRtcManager(
    private val context: Context,
    private val signalingSocket: okhttp3.WebSocket,
    private val audioSttSocket: okhttp3.WebSocket
) {
    private var peerConnectionFactory: PeerConnectionFactory
    private var peerConnection: PeerConnection? = null
    private var remoteAudioExtractor: RemoteAudioPcmExtractor? = null

    fun createPeerConnection(callId: String) {
        val observer = object : PeerConnection.Observer {
            override fun onAddTrack(receiver: RtpReceiver, mediaStreams: Array<out MediaStream>) {
                val track = receiver.track()
                if (track is AudioTrack) {
                    // Extract decoded remote caller audio frames
                    remoteAudioExtractor = RemoteAudioPcmExtractor(audioSttSocket, callId)
                    track.addSink(remoteAudioExtractor)
                }
            }
            // Additional observer events...
        }
    }
}`
    },
    'TextToVoiceSynthesizer.kt': {
      lang: 'kotlin',
      path: 'android/app/src/main/java/com/callsight/app/webrtc/TextToVoiceSynthesizer.kt',
      code: `package com.callsight.app.webrtc

import android.content.Context
import android.speech.tts.TextToSpeech
import java.util.Locale

/**
 * Text-to-Voice (TTS) Synthesizer for CallSight.
 * Converts typed messages into synthesized speech during active calls.
 * Enables non-vocal participants to communicate directly into the remote caller's audio stream.
 */
class TextToVoiceSynthesizer(
    private val context: Context,
    private val onInitComplete: (Boolean) -> Unit = {}
) : TextToSpeech.OnInitListener {
    private var tts: TextToSpeech? = null

    init {
        tts = TextToSpeech(context, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            tts?.language = Locale.getDefault()
            onInitComplete(true)
        }
    }

    fun speak(text: String, onStart: () -> Unit = {}, onDone: () -> Unit = {}) {
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "tts_\${System.currentTimeMillis()}")
    }

    fun stop() {
        tts?.stop()
    }
}`
    },
    'gnani_stt.py': {
      lang: 'python',
      path: 'backend/app/services/gnani_stt.py',
      code: `import asyncio
import json
import logging
import websockets
from typing import AsyncGenerator, Dict, Any
from ..config import settings

class GnaniPrismaStreamingClient:
    """
    Official Gnani Prisma Speech-to-Text WebSocket Streaming Client.
    Connects to wss://api.vachana.ai/stt/v3/stream using upgrade headers.
    Streams 16 kHz mono 16-bit signed PCM frames (1024 bytes / 32 ms pacing).
    """
    def __init__(self, api_key: str = None, model: str = "prisma-v2.5"):
        self.api_key = api_key or settings.GNANI_API_KEY
        self.model = model
        self.ws_url = "wss://api.vachana.ai/stt/v3/stream"

    async def connect(self) -> bool:
        headers = {
            "x-api-key-id": self.api_key,
            "x-model": self.model,
            "x-sample-rate": "16000",
            "x-channels": "1",
            "x-encoding": "signed-pcm"
        }
        self._ws = await websockets.connect(self.ws_url, extra_headers=headers)
        return True

    async def send_audio_chunk(self, pcm_chunk: bytes):
        if self._ws:
            await self._ws.send(pcm_chunk)

    async def listen_transcripts(self) -> AsyncGenerator[Dict[str, Any], None]:
        async for message in self._ws:
            data = json.loads(message)
            yield {
                "text": data.get("transcript", ""),
                "is_final": data.get("is_final", False),
                "confidence": data.get("confidence", 0.95)
            }`
    },
    'smart_highlights.py': {
      lang: 'python',
      path: 'backend/app/services/smart_highlights.py',
      code: `import re
from typing import List, Dict, Any

class SmartHighlightsEngine:
    """
    Deterministic rule-based extractor for dates, times, questions, action items,
    and phone numbers without LLM latency.
    """
    QUESTION_PATTERN = re.compile(
        r"(?:^|[.!?]\\s*)([^.!?]*\\b(?:can|could|would|will|is|are|do|how|what|when|where|why|who)\\b[^.!?]*\\?)",
        re.IGNORECASE
    )
    DATE_PATTERN = re.compile(r"\\b(?:today|tomorrow|yesterday|next\\s+\\w+|\\w+\\s+\\d{1,2})\\b", re.IGNORECASE)
    TIME_PATTERN = re.compile(r"\\b(?:\\d{1,2}:\\d{2}\\s*(?:am|pm)?|\\d{1,2}\\s*(?:am|pm|o'clock))\\b", re.IGNORECASE)
    NUMBER_PATTERN = re.compile(r"(?:\\$\\s*\\d+|\\b\\d+(?:\\.\\d+)?%|\\b\\d{4,8}\\b|\\+?\\d{10,12})", re.IGNORECASE)

    @classmethod
    def extract_from_text(cls, text: str) -> List[Dict[str, Any]]:
        highlights = []
        # Extract questions, dates, times, action items, and numbers...
        return highlights`
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(fileSnippets[selectedFile].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[85vh] bg-[#0B111E] border border-cyan-800/60 rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 bg-[#0E1628] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950 text-cyan-400 rounded-xl border border-cyan-800/50">
              <Code size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">CallSight Native Codebase Inspector</h2>
              <p className="text-[10px] text-slate-400">Production Kotlin Android & Python FastAPI implementations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selector & File List */}
        <div className="p-3 bg-[#0A0F1D] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveTab('android'); setSelectedFile('RemoteAudioPcmExtractor.kt'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === 'android'
                  ? 'bg-cyan-400 text-black shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone size={13} />
              <span>Android (Kotlin)</span>
            </button>
            <button
              onClick={() => { setActiveTab('backend'); setSelectedFile('gnani_stt.py'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === 'backend'
                  ? 'bg-cyan-400 text-black shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Server size={13} />
              <span>Backend (Python FastAPI)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'android' ? (
              <>
                <button
                  onClick={() => setSelectedFile('RemoteAudioPcmExtractor.kt')}
                  className={`px-2.5 py-1 text-[11px] rounded-lg border ${
                    selectedFile === 'RemoteAudioPcmExtractor.kt'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700'
                  }`}
                >
                  RemoteAudioPcmExtractor.kt
                </button>
                <button
                  onClick={() => setSelectedFile('WebRtcManager.kt')}
                  className={`px-2.5 py-1 text-[11px] rounded-lg border ${
                    selectedFile === 'WebRtcManager.kt'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700'
                  }`}
                >
                  WebRtcManager.kt
                </button>
                <button
                  onClick={() => setSelectedFile('TextToVoiceSynthesizer.kt')}
                  className={`px-2.5 py-1 text-[11px] rounded-lg border ${
                    selectedFile === 'TextToVoiceSynthesizer.kt'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700'
                  }`}
                >
                  TextToVoiceSynthesizer.kt
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setSelectedFile('gnani_stt.py')}
                  className={`px-2.5 py-1 text-[11px] rounded-lg border ${
                    selectedFile === 'gnani_stt.py'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700'
                  }`}
                >
                  gnani_stt.py
                </button>
                <button
                  onClick={() => setSelectedFile('smart_highlights.py')}
                  className={`px-2.5 py-1 text-[11px] rounded-lg border ${
                    selectedFile === 'smart_highlights.py'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700'
                  }`}
                >
                  smart_highlights.py
                </button>
              </>
            )}
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#060911] font-mono text-xs text-slate-200 relative">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-[10px] text-slate-400">
            <span>{fileSnippets[selectedFile]?.path}</span>
            <button
              onClick={copyCode}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 transition-colors"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
          <pre className="overflow-x-auto leading-relaxed">
            <code>{fileSnippets[selectedFile]?.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

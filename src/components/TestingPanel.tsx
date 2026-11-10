import React, { useState } from 'react';
import { Mic, MicOff, PhoneCall, Sparkles, Code, Play, RefreshCw, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { AudioStreamingManager } from '../services/audioCapture';
import { CommunicationMode } from '../types';

interface TestingPanelProps {
  onSimulateSpeech: (text: string, isFinal: boolean) => void;
  onSimulateIncomingCall: () => void;
  isCallActive: boolean;
  isInSilentMode: boolean;
  isDualDeviceMode: boolean;
  communicationMode?: CommunicationMode;
  onSwitchMode?: (mode: CommunicationMode) => void;
  onToggleDualDevice: () => void;
  onOpenCodeInspector: () => void;
}

export const TestingPanel: React.FC<TestingPanelProps> = ({
  onSimulateSpeech,
  onSimulateIncomingCall,
  isCallActive,
  isInSilentMode,
  isDualDeviceMode,
  communicationMode = 'transcribing',
  onSwitchMode,
  onToggleDualDevice,
  onOpenCodeInspector
}) => {
  const [isLiveMicStreaming, setIsLiveMicStreaming] = useState(false);
  const [audioManager, setAudioManager] = useState<AudioStreamingManager | null>(null);

  const sampleUtterances = [
    {
      label: "Meeting Schedule",
      text: "Hi Marcus, can we meet tomorrow at two thirty PM to discuss the new accessibility sprint?"
    },
    {
      label: "Action Item & Code",
      text: "Please make sure to review the PR before five o'clock. The verification code is 849201."
    },
    {
      label: "Question & Phone",
      text: "Could you call me back on plus one four one five five five five zero one nine nine?"
    },
    {
      label: "Urgent Request",
      text: "I will send the finalized WebRTC architecture document to your email right away."
    }
  ];

  const handleToggleLiveMic = async () => {
    if (isLiveMicStreaming) {
      if (audioManager) {
        audioManager.stopCapture();
        setAudioManager(null);
      }
      setIsLiveMicStreaming(false);
    } else {
      try {
        const manager = new AudioStreamingManager(
          (interim) => onSimulateSpeech(interim, false),
          (finalText) => onSimulateSpeech(finalText, true)
        );
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/calls/call_current/audio-stt?speakerName=Elena%20Vance&speakerId=usr_2`;
        await manager.startCapture(wsUrl);
        setAudioManager(manager);
        setIsLiveMicStreaming(true);
      } catch (err) {
        alert('Could not access microphone or WebSocket. Check permissions in browser.');
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-6 bg-[#0E1526]/90 border border-slate-800 rounded-3xl p-4 shadow-xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            CallSight Testbed & Audio Pipeline Simulator
          </h2>
          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
            WebRTC + 16kHz PCM + Gnani Prisma
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onSwitchMode && (
            <div className="flex items-center bg-[#131C30] p-0.5 rounded-xl border border-slate-700">
              <button
                onClick={() => onSwitchMode('transcribing')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all ${
                  communicationMode !== 'speaking' && communicationMode !== 'voice'
                    ? 'bg-cyan-400 text-black font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Switch to Transcribing Mode (Captions & text)"
              >
                <span>Transcribing</span>
              </button>
              <button
                onClick={() => onSwitchMode('speaking')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all ${
                  communicationMode === 'speaking' || communicationMode === 'voice'
                    ? 'bg-emerald-400 text-black font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Switch to Speaking Mode (Microphone Live)"
              >
                <Mic size={12} />
                <span>Speaking</span>
              </button>
            </div>
          )}

          <button
            onClick={onToggleDualDevice}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-colors ${
              isDualDeviceMode
                ? 'bg-cyan-400 text-black border-cyan-300 font-bold shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Layers size={14} className={isDualDeviceMode ? 'text-black' : 'text-cyan-400'} />
            <span>{isDualDeviceMode ? 'Dual Device Mode' : 'Two-Device Mode'}</span>
          </button>

          <button
            onClick={onOpenCodeInspector}
            className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-xs font-semibold rounded-xl border border-cyan-800/60 flex items-center gap-1.5 transition-colors"
          >
            <Code size={14} className="text-cyan-400" />
            <span>View Architecture</span>
          </button>
        </div>
      </div>

      <div className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Remote Audio Input Simulator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Mic size={13} className="text-cyan-400" />
              <span>Remote Caller Speech Feed</span>
            </span>
            <span className="text-[10px] text-slate-400">16kHz mono signed 16-bit PCM</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleLiveMic}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                isLiveMicStreaming
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-md'
              }`}
            >
              {isLiveMicStreaming ? <MicOff size={14} /> : <Mic size={14} />}
              <span>{isLiveMicStreaming ? 'Stop Live Mic Streaming' : 'Stream Live Mic (16kHz PCM)'}</span>
            </button>

            <button
              onClick={onSimulateIncomingCall}
              disabled={isCallActive}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <PhoneCall size={14} className="text-emerald-400" />
              <span>Trigger Call</span>
            </button>
          </div>

          {isLiveMicStreaming && (
            <p className="text-[10px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={11} />
              <span>Streaming 1024-byte PCM frames into CallSight STT pipeline. Speak now!</span>
            </p>
          )}
        </div>

        {/* Right: Preset Conversational Utterances for Rapid Verification */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles size={13} className="text-cyan-400" />
            <span>Simulate Caller Utterance (Highlights Verification)</span>
          </span>

          <div className="grid grid-cols-2 gap-1.5">
            {sampleUtterances.map((u, i) => (
              <button
                key={i}
                onClick={() => {
                  // Simulate interim speech then finalize
                  onSimulateSpeech(u.text.substring(0, Math.floor(u.text.length * 0.6)) + "...", false);
                  setTimeout(() => {
                    onSimulateSpeech(u.text, true);
                  }, 600);
                }}
                className="p-2 bg-[#131C30] hover:bg-[#1A2642] border border-slate-800 text-left rounded-xl transition-all hover:border-cyan-500/40"
              >
                <div className="text-[11px] font-bold text-cyan-300">{u.label}</div>
                <div className="text-[10px] text-slate-400 truncate">{u.text}</div>
              </button>
            ))}
          </div>

          <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
            <span>Bidirectional Mode: Switch between Voice-to-Text & Text-to-Voice</span>
          </div>
        </div>
      </div>
    </div>
  );
};
